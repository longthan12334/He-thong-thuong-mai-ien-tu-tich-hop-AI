'use strict';
const { Inventory, InventoryTransaction, Warehouse } = require('../../database/models');
const { INVENTORY_TX } = require('../../shared/constants/enums');

/**
 * Tác động tồn kho đi kèm vòng đời đơn hàng.
 *
 * Nguyên tắc: khi khách đặt đơn, hệ thống KHÔNG trừ thẳng qty_on_hand mà tăng
 * qty_reserved. Chỉ tới lúc hàng thực sự rời kho (đơn chuyển sang SHIPPING) mới
 * trừ qty_on_hand. Nhờ vậy đơn bị hủy giữa chừng chỉ cần nhả giữ chỗ, và số liệu
 * tồn kho không bao giờ sai lệch.
 *
 * Mọi thay đổi đều ghi một dòng vào inventory_transactions để truy vết được.
 */

/**
 * Tìm các dòng tồn kho của một biến thể, ưu tiên kho mặc định của gian hàng.
 * Một biến thể có thể nằm ở nhiều kho nên phải rút lần lượt cho đủ số lượng.
 */
async function findInventories(variantId, shopId, transaction, orderBy) {
  return Inventory.findAll({
    where: { variant_id: variantId },
    include: [{
      model: Warehouse, as: 'warehouse', required: true,
      where: shopId ? { shop_id: shopId } : {},
      attributes: ['warehouse_id', 'shop_id', 'is_default'],
    }],
    order: orderBy,
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });
}

/** Ghi một dòng nhật ký biến động kho. */
function logTransaction(inventoryId, type, qtyChange, orderId, userId, transaction) {
  return InventoryTransaction.create({
    inventory_id: inventoryId,
    transaction_type: type,
    qty_change: qtyChange,
    ref_type: 'ORDER',
    ref_id: orderId,
    created_by: userId || null,
    created_at: new Date(),
  }, { transaction });
}

/**
 * Rút `quantity` đơn vị khỏi một trường số của các dòng tồn kho.
 * Trả về số lượng thực sự xử lý được (có thể nhỏ hơn yêu cầu nếu dữ liệu lệch).
 */
async function drain(rows, quantity, pick, apply, transaction) {
  let remaining = quantity;
  const touched = [];
  for (const row of rows) {
    if (remaining <= 0) break;
    const available = pick(row);
    if (available <= 0) continue;
    const take = Math.min(available, remaining);
    await apply(row, take);
    await row.save({ transaction });
    touched.push({ inventory: row, qty: take });
    remaining -= take;
  }
  return { touched, processed: quantity - remaining, shortfall: remaining };
}

/**
 * Giữ chỗ hàng khi tạo đơn: qty_reserved tăng lên.
 * Ném lỗi nếu không đủ hàng khả dụng (qty_on_hand - qty_reserved).
 */
async function reserve(items, shopId, orderId, userId, transaction) {
  const result = [];
  for (const item of items) {
    const rows = await findInventories(item.variant_id, shopId, transaction,
      [[{ model: Warehouse, as: 'warehouse' }, 'is_default', 'DESC'], ['qty_on_hand', 'DESC']]);

    const { touched, shortfall } = await drain(
      rows, item.quantity,
      (r) => r.qty_on_hand - r.qty_reserved,
      (r, take) => { r.qty_reserved += take; r.updated_at = new Date(); },
      transaction,
    );
    if (shortfall > 0) {
      const err = new Error(`Biến thể ${item.variant_id} không đủ hàng, còn thiếu ${shortfall}`);
      err.code = 'OUT_OF_STOCK';
      throw err;
    }
    for (const t of touched) {
      await logTransaction(t.inventory.inventory_id, INVENTORY_TX.RESERVE, t.qty, orderId, userId, transaction);
    }
    result.push({ variantId: item.variant_id, reserved: item.quantity });
  }
  return result;
}

/**
 * Nhả giữ chỗ khi đơn bị hủy trước lúc xuất kho: qty_reserved giảm,
 * qty_on_hand giữ nguyên vì hàng chưa bao giờ rời kho.
 */
async function release(items, shopId, orderId, userId, transaction) {
  const result = [];
  for (const item of items) {
    const rows = await findInventories(item.variant_id, shopId, transaction, [['qty_reserved', 'DESC']]);
    const { touched, processed } = await drain(
      rows, item.quantity,
      (r) => r.qty_reserved,
      (r, take) => { r.qty_reserved -= take; r.updated_at = new Date(); },
      transaction,
    );
    for (const t of touched) {
      await logTransaction(t.inventory.inventory_id, INVENTORY_TX.RELEASE, -t.qty, orderId, userId, transaction);
    }
    result.push({ variantId: item.variant_id, released: processed });
  }
  return result;
}

/**
 * Xuất kho thật khi đơn chuyển sang SHIPPING:
 * trừ đồng thời qty_on_hand và qty_reserved vì phần giữ chỗ nay đã thành hàng đi.
 */
async function issue(items, shopId, orderId, userId, transaction) {
  const result = [];
  for (const item of items) {
    const rows = await findInventories(item.variant_id, shopId, transaction, [['qty_reserved', 'DESC']]);
    const { touched, processed, shortfall } = await drain(
      rows, item.quantity,
      (r) => Math.min(r.qty_reserved, r.qty_on_hand),
      (r, take) => {
        r.qty_reserved -= take;
        r.qty_on_hand -= take;
        r.updated_at = new Date();
      },
      transaction,
    );
    // Dữ liệu lệch (ví dụ đơn cũ tạo trước khi có cơ chế giữ chỗ): trừ thẳng tồn.
    if (shortfall > 0) {
      const fallback = await findInventories(item.variant_id, shopId, transaction, [['qty_on_hand', 'DESC']]);
      const extra = await drain(
        fallback, shortfall,
        (r) => r.qty_on_hand,
        (r, take) => { r.qty_on_hand -= take; r.updated_at = new Date(); },
        transaction,
      );
      touched.push(...extra.touched);
    }
    for (const t of touched) {
      await logTransaction(t.inventory.inventory_id, INVENTORY_TX.EXPORT, -t.qty, orderId, userId, transaction);
    }
    result.push({ variantId: item.variant_id, issued: processed + (shortfall > 0 ? shortfall : 0) });
  }
  return result;
}

/** Nhập lại kho khi khách trả hàng: qty_on_hand tăng trở lại. */
async function restock(items, shopId, orderId, userId, transaction) {
  const result = [];
  for (const item of items) {
    const rows = await findInventories(item.variant_id, shopId, transaction,
      [[{ model: Warehouse, as: 'warehouse' }, 'is_default', 'DESC']]);
    const target = rows[0];
    if (!target) continue;
    target.qty_on_hand += item.quantity;
    target.updated_at = new Date();
    await target.save({ transaction });
    await logTransaction(target.inventory_id, INVENTORY_TX.RETURN, item.quantity, orderId, userId, transaction);
    result.push({ variantId: item.variant_id, restocked: item.quantity });
  }
  return result;
}

/** Số lượng còn bán được của một biến thể, cộng trên mọi kho. */
async function availableQuantity(variantId) {
  const rows = await Inventory.findAll({
    where: { variant_id: variantId },
    attributes: ['qty_on_hand', 'qty_reserved'],
  });
  return rows.reduce((sum, r) => sum + (r.qty_on_hand - r.qty_reserved), 0);
}

module.exports = { reserve, release, issue, restock, availableQuantity, findInventories };
