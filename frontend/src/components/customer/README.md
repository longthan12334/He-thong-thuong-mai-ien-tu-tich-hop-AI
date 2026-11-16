# 🛒 CUSTOMER WEB MODULE — HƯỚNG DẪN DÀNH CHO DEV KHÁCH HÀNG

## 📌 Phân Công Trách Nhiệm
- **Nhóm phụ trách:** Lập trình viên Customer (Khách mua sắm)
- **Phạm vi làm việc:**
  - Thư mục Components: `src/components/customer/`
  - Thư mục Trang: `src/app/shop/` hoặc `src/app/(customer)/`
  - Các chức năng: Danh mục mua sắm, Bộ sưu tập thời trang, Trang chi tiết sản phẩm khách hàng, Giỏ hàng cá nhân, Checkout thanh toán online/COD, Lịch sử đơn hàng của tôi.

---

## 🏗️ Kiến Trúc Được Sử Dụng Sẵn (Không Cần Viết Lại):
Khi phát triển giao diện Khách Hàng, bạn **dùng trực tiếp** các tài nguyên lõi đã được Nguyễn Đức Mạnh chuẩn hóa:

1. **Gọi API:**
   - Dùng `productService` từ `@/services/product.service` (lấy danh sách sản phẩm, chi tiết sản phẩm).
   - Dùng `orderService` từ `@/services/order.service` (tạo đơn hàng, tra cứu đơn hàng).
   - Dùng `authService` từ `@/services/auth.service` (đăng nhập/đăng ký tài khoản khách).

2. **UI Kit dùng chung (`@/components/ui`):**
   - `Button`: Nút bấm đa kích thước và biến thể màu sắc.
   - `Modal`: Hộp thoại popup có sẵn hiệu ứng mờ nền và phím Escape.
   - `Card`, `CardHeader`, `CardContent`: Thẻ hiển thị nội dung.
   - `Badge`: Huy hiệu trạng thái, tag khuyến mãi.
   - `Input`: Ô nhập liệu có validation lỗi và label tự động.
   - `Skeleton`: Hiệu ứng tải trang khung xương khi đợi API.

3. **Hooks & Tiện ích:**
   - `useAuth()`: Lấy thông tin khách hàng đang đăng nhập, hàm logout.
   - `useToast()`: Hiển thị thông báo toast góc màn hình (`showToast('Đã thêm vào giỏ!')`).
   - `formatVND(amount)` từ `@/lib/utils`: Format tiền tệ chuẩn Việt Nam (ví dụ: `2.790.000 đ`).

---

## 🚫 Quy Tắc Tránh Xung Đột Code (Anti-Conflict Rules)
1. **KHÔNG** sửa trực tiếp vào thư mục `src/components/seller/` (thuộc phân hệ Người Bán).
2. **KHÔNG** tự ý sửa `src/services/api-client.ts` nếu chưa thảo luận với Lead/Seller Dev.
3. Mọi component mới phục vụ giao diện Khách hàng đặt trong `src/components/customer/`.

---

## ✅ Hiện Trạng Đã Hoàn Thành (Phân hệ Khách hàng)

### Trang (`src/app/`)
| Đường dẫn | Chức năng | Đăng nhập |
| :--- | :--- | :--- |
| `/shop` | Khu mua sắm toàn sàn: tìm kiếm không dấu, lọc danh mục thật (API) + thương hiệu + khoảng giá + còn hàng, sắp xếp, phân trang 12 SP, gợi ý cá nhân hóa, sản phẩm đã xem | Không bắt buộc |
| `/product-detail/[id]` | Chi tiết sản phẩm dữ liệu thật: gallery + lightbox, chọn màu/size theo biến thể & tồn kho, AI Stylist, đánh giá, sản phẩm tương tự | Không bắt buộc |
| `/shop/my-orders` | Đơn hàng của tôi: thống kê, tab trạng thái, tìm kiếm, timeline 5 bước, hủy đơn khi còn Chờ xác nhận | Bắt buộc |
| `/shop/track-order` | Tra cứu đơn cho khách vãng lai bằng Mã đơn + SĐT | Không bắt buộc |
| `/shop/wishlist` | Danh sách yêu thích (giá & tồn kho cập nhật theo sàn, báo giảm giá) | Không bắt buộc |

### Components (`src/components/customer/`)
- `CustomerProductCard` — thẻ SP phía khách (không lộ giá vốn/biên lợi nhuận của Seller), nút thả tim.
- `CustomerFilters`, `CustomerPagination`, `ShopSubnav` — bộ lọc, phân trang, tab điều hướng khu mua sắm.
- `CustomerCartModal` → `CustomerCheckoutModal` → `OrderSuccessModal` — luồng mua hàng, gắn toàn cục qua `CustomerCommerceLayer` trong `app/layout.tsx` (mở được ở mọi trang).
- `AIStylistPanel` — gọi `GET /api/ai/recommend`, gợi ý "Hoàn thiện set đồ" từ danh mục bổ trợ.
- `CustomerOrderCard`, `OrderTimeline` — thẻ đơn hàng & tiến trình vận chuyển.

### Hạ tầng dùng chung đã bổ sung
- `contexts/ShopperContext.tsx` — Wishlist + Sản phẩm đã xem (localStorage).
- `hooks/useCatalog.ts` — cache danh mục sản phẩm toàn sàn dùng chung giữa các trang.
- `lib/customer.ts` — nhận diện thương hiệu, biến thể, bộ máy gợi ý, công thức phí ship/VAT khớp Backend, kiểm tra SĐT VN.
- `services/ai.service.ts`; `orderService.getMyOrders()` / `cancelMyOrder()`.
- `CartContext` — mỗi dòng giỏ = sản phẩm + phân loại (size/màu khác nhau không bị gộp).
- Đăng ký mới mặc định role `Customer`; khách đăng nhập được đưa về `/shop`.
- Backend: `PATCH /api/orders/{id}/cancel` (khách tự hủy đơn Pending, hoàn tồn kho).
- CSS riêng: `styles/customer.css` (tiền tố `customer-*`, không ghi đè class của Seller).
