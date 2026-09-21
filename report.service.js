'use strict';
const { sequelize } = require('../../database/models');
const { parseDateRange, previousPeriod, growthRate } = require('../../shared/utils/dateRange');
const { dateBucket, fillBuckets, GRANULARITY } = require('../../shared/utils/sqlDialect');
const { STATUS_LABEL } = require('../orders/order.constants');
const { ORDER_STATUS, PAYMENT_TXN_STATUS } = require('../../shared/constants/enums');

/**
 * HTTMDTTHA-70 — Báo cáo và thống kê doanh thu cho quản trị viên.
 *
 * Các truy vấn tổng hợp ở đây viết bằng SQL thuần thay vì ORM, vì chúng gom nhóm
 * nhiều bảng và cần kiểm soát chính xác mệnh đề GROUP BY. Khác biệt cú pháp giữa
 * MySQL và PostgreSQL được che bởi shared/utils/sqlDialect.
 *
 * Định nghĩa doanh thu: chỉ tính đơn ở trạng thái DELIVERED hoặc COMPLETED.
 * Đơn đang chờ hoặc đã hủy không được cộng vào, nên số liệu không bị phồng.
 */

const REVENUE_SQL = `('${ORDER_STATUS.DELIVERED}', '${ORDER_STATUS.COMPLETED}')`;

const q = (sql, replacements) =>
  sequelize.query(sql, { replacements, type: sequelize.QueryTypes.SELECT });

const num = (v) => Number(v ?? 0);

/* ------------------------------------------------------------------ */
/*  1. Tổng quan — các chỉ số then chốt kèm mức tăng trưởng            */
/* ------------------------------------------------------------------ */

/** Gom các chỉ số của một khoảng thời gian trong đúng một truy vấn. */
async function metricsFor(from, to) {
  const [row] = await q(`
    SELECT
      COUNT(*)                                                        AS order_count,
      COALESCE(SUM(CASE WHEN order_status IN ${REVENUE_SQL}
                        THEN total_amount ELSE 0 END), 0)             AS revenue,
      COUNT(CASE WHEN order_status IN ${REVENUE_SQL} THEN 1 END)      AS paid_orders,
      COUNT(CASE WHEN order_status = '${ORDER_STATUS.CANCELLED}' THEN 1 END) AS cancelled_orders,
      COUNT(DISTINCT user_id)                                         AS customer_count,
      COUNT(DISTINCT shop_id)                                         AS active_shops
    FROM orders
    WHERE placed_at BETWEEN :from AND :to
  `, { from, to });

  const [items] = await q(`
    SELECT COALESCE(SUM(oi.quantity), 0) AS items_sold
    FROM order_items oi
    JOIN orders o ON o.order_id = oi.order_id
    WHERE o.placed_at BETWEEN :from AND :to
      AND o.order_status IN ${REVENUE_SQL}
  `, { from, to });

  const [users] = await q(`
    SELECT COUNT(*) AS new_customers
    FROM users
    WHERE created_at BETWEEN :from AND :to
  `, { from, to });

  const revenue = num(row.revenue);
  const paidOrders = num(row.paid_orders);
  const orderCount = num(row.order_count);

  return {
    revenue,
    orderCount,
    paidOrders,
    cancelledOrders: num(row.cancelled_orders),
    customerCount: num(row.customer_count),
    activeShops: num(row.active_shops),
    itemsSold: num(items.items_sold),
    newCustomers: num(users.new_customers),
    averageOrderValue: paidOrders ? Math.round(revenue / paidOrders) : 0,
    cancelRate: orderCount ? Number(((num(row.cancelled_orders) / orderCount) * 100).toFixed(2)) : 0,
  };
}

/** Các chỉ số tổng quan, so sánh với kỳ liền trước có cùng độ dài. */
async function getOverview(query = {}) {
  const range = parseDateRange(query);
  const prev = previousPeriod(range);

  const [current, previous] = await Promise.all([
    metricsFor(range.from, range.to),
    metricsFor(prev.from, prev.to),
  ]);

  const kpi = (key, format = 'number', label = '') => ({
    key, label, format,
    value: current[key],
    previousValue: previous[key],
    growth: growthRate(current[key], previous[key]),
  });

  return {
    range: { from: range.from, to: range.to, days: range.days },
    previousRange: { from: prev.from, to: prev.to },
    kpis: [
      kpi('revenue', 'currency', 'Tổng doanh thu'),
      kpi('orderCount', 'number', 'Tổng đơn hàng'),
      kpi('averageOrderValue', 'currency', 'Giá trị đơn trung bình'),
      kpi('itemsSold', 'number', 'Sản phẩm đã bán'),
      kpi('newCustomers', 'number', 'Khách hàng mới'),
      kpi('cancelRate', 'percent', 'Tỷ lệ hủy đơn'),
      kpi('activeShops', 'number', 'Gian hàng có đơn'),
      kpi('paidOrders', 'number', 'Đơn đã giao thành công'),
    ],
    current,
    previous,
  };
}

/* ------------------------------------------------------------------ */
/*  2. Chuỗi doanh thu theo thời gian                                  */
/* ------------------------------------------------------------------ */

/**
 * Doanh thu theo ngày, tuần hoặc tháng.
 * Những mốc không phát sinh đơn vẫn được trả về với giá trị 0,
 * để biểu đồ đường không bị đứt quãng.
 */
async function getRevenueSeries(query = {}) {
  const range = parseDateRange(query);
  const granularity = Object.values(GRANULARITY).includes(query.granularity)
    ? query.granularity : GRANULARITY.DAY;

  const bucket = dateBucket('placed_at', granularity);

  const rows = await q(`
    SELECT ${bucket} AS bucket,
           COALESCE(SUM(CASE WHEN order_status IN ${REVENUE_SQL}
                             THEN total_amount ELSE 0 END), 0) AS revenue,
           COUNT(*)                                            AS order_count,
           COUNT(CASE WHEN order_status IN ${REVENUE_SQL} THEN 1 END) AS paid_count
    FROM orders
    WHERE placed_at BETWEEN :from AND :to
    GROUP BY ${bucket}
    ORDER BY bucket ASC
  `, { from: range.from, to: range.to });

  const mapped = rows.map((r) => ({
    bucket: r.bucket,
    revenue: num(r.revenue),
    orderCount: num(r.order_count),
    paidCount: num(r.paid_count),
  }));

  const series = fillBuckets(mapped, range, granularity);
  const totalRevenue = series.reduce((s, p) => s + num(p.revenue), 0);

  return {
    range: { from: range.from, to: range.to, days: range.days },
    granularity,
    series,
    totals: {
      revenue: totalRevenue,
      orderCount: series.reduce((s, p) => s + num(p.orderCount), 0),
      peak: series.reduce((best, p) => (num(p.revenue) > num(best?.revenue) ? p : best), series[0] || null),
    },
  };
}

/* ------------------------------------------------------------------ */
/*  3. Phân bố trạng thái đơn hàng                                     */
/* ------------------------------------------------------------------ */
async function getOrdersByStatus(query = {}) {
  const range = parseDateRange(query);
  const rows = await q(`
    SELECT order_status,
           COUNT(*)                                   AS order_count,
           COALESCE(SUM(total_amount), 0)             AS amount
    FROM orders
    WHERE placed_at BETWEEN :from AND :to
    GROUP BY order_status
  `, { from: range.from, to: range.to });

  const found = Object.fromEntries(rows.map((r) => [r.order_status, r]));
  const total = rows.reduce((s, r) => s + num(r.order_count), 0);

  return {
    range: { from: range.from, to: range.to },
    total,
    items: Object.values(ORDER_STATUS).map((status) => {
      const r = found[status];
      const count = num(r?.order_count);
      return {
        status,
        label: STATUS_LABEL[status],
        count,
        amount: num(r?.amount),
        percentage: total ? Number(((count / total) * 100).toFixed(2)) : 0,
      };
    }),
  };
}

/* ------------------------------------------------------------------ */
/*  4. Xếp hạng                                                        */
/* ------------------------------------------------------------------ */

/** Sản phẩm bán chạy nhất theo doanh thu trong kỳ. */
async function getTopProducts(query = {}) {
  const range = parseDateRange(query);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 10));

  const rows = await q(`
    SELECT p.product_id,
           p.product_name,
           p.slug,
           s.shop_name,
           COALESCE(SUM(oi.quantity), 0)    AS quantity_sold,
           COALESCE(SUM(oi.line_total), 0)  AS revenue,
           COUNT(DISTINCT o.order_id)       AS order_count
    FROM order_items oi
    JOIN orders o           ON o.order_id = oi.order_id
    JOIN product_variants v ON v.variant_id = oi.variant_id
    JOIN products p         ON p.product_id = v.product_id
    JOIN shops s            ON s.shop_id = p.shop_id
    WHERE o.placed_at BETWEEN :from AND :to
      AND o.order_status IN ${REVENUE_SQL}
    GROUP BY p.product_id, p.product_name, p.slug, s.shop_name
    ORDER BY revenue DESC
    LIMIT :limit
  `, { from: range.from, to: range.to, limit });

  return {
    range: { from: range.from, to: range.to },
    items: rows.map((r, i) => ({
      rank: i + 1,
      productId: num(r.product_id),
      productName: r.product_name,
      slug: r.slug,
      shopName: r.shop_name,
      quantitySold: num(r.quantity_sold),
      revenue: num(r.revenue),
      orderCount: num(r.order_count),
    })),
  };
}

/** Gian hàng có doanh thu cao nhất trong kỳ. */
async function getTopShops(query = {}) {
  const range = parseDateRange(query);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 10));

  const rows = await q(`
    SELECT s.shop_id,
           s.shop_name,
           s.rating_avg,
           COUNT(o.order_id)                AS order_count,
           COALESCE(SUM(o.total_amount), 0) AS revenue
    FROM orders o
    JOIN shops s ON s.shop_id = o.shop_id
    WHERE o.placed_at BETWEEN :from AND :to
      AND o.order_status IN ${REVENUE_SQL}
    GROUP BY s.shop_id, s.shop_name, s.rating_avg
    ORDER BY revenue DESC
    LIMIT :limit
  `, { from: range.from, to: range.to, limit });

  const total = rows.reduce((s, r) => s + num(r.revenue), 0);

  return {
    range: { from: range.from, to: range.to },
    items: rows.map((r, i) => ({
      rank: i + 1,
      shopId: num(r.shop_id),
      shopName: r.shop_name,
      ratingAvg: Number(r.rating_avg ?? 0),
      orderCount: num(r.order_count),
      revenue: num(r.revenue),
      share: total ? Number(((num(r.revenue) / total) * 100).toFixed(2)) : 0,
    })),
  };
}

/**
 * Doanh thu theo danh mục gốc (cấp 1 của cây danh mục).
 *
 * Việc quy một danh mục lá về danh mục gốc được làm ở tầng ứng dụng thay vì
 * bóc tách chuỗi `path` trong SQL, vì hàm cắt chuỗi và ép kiểu khác nhau giữa
 * MySQL và PostgreSQL. Cây danh mục chỉ vài chục dòng nên chi phí không đáng kể.
 */
async function getRevenueByCategory(query = {}) {
  const range = parseDateRange(query);

  const [rows, categories] = await Promise.all([
    q(`
      SELECT p.category_id,
             COALESCE(SUM(oi.line_total), 0) AS revenue,
             COALESCE(SUM(oi.quantity), 0)   AS quantity_sold
      FROM order_items oi
      JOIN orders o           ON o.order_id = oi.order_id
      JOIN product_variants v ON v.variant_id = oi.variant_id
      JOIN products p         ON p.product_id = v.product_id
      WHERE o.placed_at BETWEEN :from AND :to
        AND o.order_status IN ${REVENUE_SQL}
      GROUP BY p.category_id
    `, { from: range.from, to: range.to }),
    q('SELECT category_id, parent_id, category_name FROM categories', {}),
  ]);

  const byId = new Map(categories.map((c) => [num(c.category_id), c]));

  /** Leo ngược cây tới danh mục không còn cha. Có chặn vòng lặp phòng dữ liệu hỏng. */
  const rootOf = (categoryId) => {
    let node = byId.get(num(categoryId));
    let guard = 0;
    while (node && node.parent_id !== null && node.parent_id !== undefined && guard < 10) {
      const parent = byId.get(num(node.parent_id));
      if (!parent) break;
      node = parent;
      guard += 1;
    }
    return node;
  };

  const rolled = new Map();
  for (const r of rows) {
    const root = rootOf(r.category_id);
    if (!root) continue;
    const key = num(root.category_id);
    const acc = rolled.get(key) || { categoryId: key, categoryName: root.category_name, revenue: 0, quantitySold: 0 };
    acc.revenue += num(r.revenue);
    acc.quantitySold += num(r.quantity_sold);
    rolled.set(key, acc);
  }

  const items = [...rolled.values()].sort((a, b) => b.revenue - a.revenue);
  const total = items.reduce((s, x) => s + x.revenue, 0);

  return {
    range: { from: range.from, to: range.to },
    total,
    items: items.map((x) => ({
      ...x,
      share: total ? Number(((x.revenue / total) * 100).toFixed(2)) : 0,
    })),
  };
}

/** Phân bố phương thức thanh toán của các đơn đã giao thành công. */
async function getPaymentMethods(query = {}) {
  const range = parseDateRange(query);

  const rows = await q(`
    SELECT pm.payment_method,
           COUNT(*)                        AS order_count,
           COALESCE(SUM(pm.amount), 0)     AS amount
    FROM payments pm
    JOIN orders o ON o.order_id = pm.order_id
    WHERE o.placed_at BETWEEN :from AND :to
      AND pm.payment_status = :paidStatus
    GROUP BY pm.payment_method
    ORDER BY amount DESC
  `, { from: range.from, to: range.to, paidStatus: PAYMENT_TXN_STATUS.SUCCESS });

  const total = rows.reduce((s, r) => s + num(r.amount), 0);

  return {
    range: { from: range.from, to: range.to },
    total,
    items: rows.map((r) => ({
      method: r.payment_method,
      orderCount: num(r.order_count),
      amount: num(r.amount),
      share: total ? Number(((num(r.amount) / total) * 100).toFixed(2)) : 0,
    })),
  };
}

/* ------------------------------------------------------------------ */
/*  5. Dữ liệu thô phục vụ xuất tệp                                    */
/* ------------------------------------------------------------------ */
async function getOrderRows(query = {}) {
  const range = parseDateRange(query);
  return q(`
    SELECT o.order_code, o.placed_at, o.order_status, o.payment_status,
           o.subtotal_amount, o.discount_amount, o.shipping_fee, o.total_amount,
           o.receiver_name, o.receiver_phone,
           s.shop_name, u.full_name AS customer_name, u.email AS customer_email
    FROM orders o
    JOIN shops s ON s.shop_id = o.shop_id
    JOIN users u ON u.user_id = o.user_id
    WHERE o.placed_at BETWEEN :from AND :to
    ORDER BY o.placed_at DESC
  `, { from: range.from, to: range.to });
}

/** Gói toàn bộ số liệu cho màn hình thống kê chỉ bằng một lần gọi API. */
async function getDashboard(query = {}) {
  const [overview, revenue, byStatus, topProducts, topShops, byCategory, payments] =
    await Promise.all([
      getOverview(query),
      getRevenueSeries(query),
      getOrdersByStatus(query),
      getTopProducts({ ...query, limit: query.limit || 10 }),
      getTopShops({ ...query, limit: 5 }),
      getRevenueByCategory(query),
      getPaymentMethods(query),
    ]);

  return { overview, revenue, byStatus, topProducts, topShops, byCategory, payments };
}

module.exports = {
  getOverview, getRevenueSeries, getOrdersByStatus, getTopProducts, getTopShops,
  getRevenueByCategory, getPaymentMethods, getOrderRows, getDashboard, metricsFor,
};
