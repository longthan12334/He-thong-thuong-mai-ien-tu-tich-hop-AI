'use strict';
const service = require('./report.service');
const { ok, catchAsync } = require('../../shared/http/response');
const { toCsv } = require('../../shared/utils/csv');
const { STATUS_LABEL } = require('../orders/order.constants');

/** GET /admin/reports/overview — các chỉ số then chốt kèm tăng trưởng so với kỳ trước */
const overview = catchAsync(async (req, res) =>
  ok(res, await service.getOverview(req.query), 'Lấy tổng quan thành công'));

/** GET /admin/reports/revenue — chuỗi doanh thu theo ngày, tuần hoặc tháng */
const revenue = catchAsync(async (req, res) =>
  ok(res, await service.getRevenueSeries(req.query), 'Lấy chuỗi doanh thu thành công'));

/** GET /admin/reports/orders-by-status — phân bố trạng thái đơn hàng */
const ordersByStatus = catchAsync(async (req, res) =>
  ok(res, await service.getOrdersByStatus(req.query), 'Lấy phân bố trạng thái thành công'));

/** GET /admin/reports/top-products — sản phẩm bán chạy */
const topProducts = catchAsync(async (req, res) =>
  ok(res, await service.getTopProducts(req.query), 'Lấy sản phẩm bán chạy thành công'));

/** GET /admin/reports/top-shops — gian hàng doanh thu cao */
const topShops = catchAsync(async (req, res) =>
  ok(res, await service.getTopShops(req.query), 'Lấy xếp hạng gian hàng thành công'));

/** GET /admin/reports/revenue-by-category — doanh thu theo danh mục gốc */
const revenueByCategory = catchAsync(async (req, res) =>
  ok(res, await service.getRevenueByCategory(req.query), 'Lấy doanh thu theo danh mục thành công'));

/** GET /admin/reports/payment-methods — phân bố phương thức thanh toán */
const paymentMethods = catchAsync(async (req, res) =>
  ok(res, await service.getPaymentMethods(req.query), 'Lấy phân bố thanh toán thành công'));

/**
 * GET /admin/reports/dashboard
 * Gói toàn bộ số liệu của trang thống kê vào một lần gọi, tránh để giao diện
 * bắn bảy request song song mỗi lần đổi khoảng thời gian.
 */
const dashboard = catchAsync(async (req, res) =>
  ok(res, await service.getDashboard(req.query), 'Lấy dữ liệu bảng thống kê thành công'));

/** GET /admin/reports/export — xuất CSV để mở bằng Excel */
const exportCsv = catchAsync(async (req, res) => {
  const type = req.query.type || 'orders';
  let csv;
  let filename;

  if (type === 'revenue') {
    const data = await service.getRevenueSeries(req.query);
    csv = toCsv(data.series, [
      { label: 'Kỳ', key: 'bucket' },
      { label: 'Doanh thu (VND)', key: 'revenue' },
      { label: 'Tổng đơn', key: 'orderCount' },
      { label: 'Đơn thành công', key: 'paidCount' },
    ]);
    filename = `doanh-thu-${data.granularity}`;
  } else if (type === 'products') {
    const data = await service.getTopProducts({ ...req.query, limit: 50 });
    csv = toCsv(data.items, [
      { label: 'Hạng', key: 'rank' },
      { label: 'Sản phẩm', key: 'productName' },
      { label: 'Gian hàng', key: 'shopName' },
      { label: 'Số lượng bán', key: 'quantitySold' },
      { label: 'Doanh thu (VND)', key: 'revenue' },
      { label: 'Số đơn', key: 'orderCount' },
    ]);
    filename = 'san-pham-ban-chay';
  } else {
    const rows = await service.getOrderRows(req.query);
    csv = toCsv(rows, [
      { label: 'Mã đơn', key: 'order_code' },
      { label: 'Ngày đặt', value: (r) => new Date(r.placed_at).toLocaleString('vi-VN') },
      { label: 'Trạng thái', value: (r) => STATUS_LABEL[r.order_status] || r.order_status },
      { label: 'Thanh toán', key: 'payment_status' },
      { label: 'Gian hàng', key: 'shop_name' },
      { label: 'Khách hàng', key: 'customer_name' },
      { label: 'Email', key: 'customer_email' },
      { label: 'Người nhận', key: 'receiver_name' },
      { label: 'Điện thoại', key: 'receiver_phone' },
      { label: 'Tiền hàng', key: 'subtotal_amount' },
      { label: 'Giảm giá', key: 'discount_amount' },
      { label: 'Phí vận chuyển', key: 'shipping_fee' },
      { label: 'Tổng tiền', key: 'total_amount' },
    ]);
    filename = 'don-hang';
  }

  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}-${stamp}.csv"`);
  return res.status(200).send(csv);
});

module.exports = {
  overview, revenue, ordersByStatus, topProducts, topShops,
  revenueByCategory, paymentMethods, dashboard, exportCsv,
};
