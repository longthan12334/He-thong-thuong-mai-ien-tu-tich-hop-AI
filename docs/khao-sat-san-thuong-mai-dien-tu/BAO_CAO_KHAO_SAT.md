# BÁO CÁO KHẢO SÁT CÁC SÀN THƯƠNG MẠI ĐIỆN TỬ
## 1. Thông tin tài liệu

**Dự án** — Aethelgard Shopping Mall, hệ thống thương mại điện tử thời trang tích hợp AI.

**Phiên bản** — 1.0 · **Ngày khảo sát** — 19/11/2026 · **Nhánh** — tricong.

**Mốc mã nguồn đối chiếu** — 479c120c43d0d5ac9817d2b209f4d482611c86b1. Mọi nhận xét về dự án trong báo cáo gắn với mốc này.

**Đối tượng** — Shopee là đối tượng chính, so sánh với Lazada và TikTok Shop tại Việt Nam. Lazada bổ sung góc nhìn gian hàng thương hiệu và hỗ trợ sau bán. TikTok Shop bổ sung góc nhìn khám phá sản phẩm qua nội dung và quản lý chất lượng người bán.

**Đầu ra** — Bản Markdown để nhóm cập nhật và PDF cùng nội dung để nộp, thảo luận hoặc bảo vệ đồ án. Các giải pháp trong tài liệu là đề xuất cho backlog, chưa được triển khai bởi nhiệm vụ khảo sát này.

## 2. Bối cảnh và mục tiêu dự án

### 2.1. Phạm vi được xác nhận từ repository

README mô tả sàn thời trang đa người bán với ba vai trò Customer, Seller và Admin. Backend dùng .NET 10 Web API, EF Core, các tầng API/BLL/DAL/Common. Frontend dùng Next.js, React và TypeScript. Docker Compose đóng gói backend và frontend, lưu SQLite qua volume. Đây là phạm vi của repository được khảo sát.

Báo cáo dùng mã nguồn để kiểm tra mô tả, tránh lấy những con số test, số sản phẩm hoặc tuyên bố hiệu năng trong README làm kết quả thực nghiệm mới.

| Phân hệ | Bằng chứng mã nguồn tương đối từ gốc repo | Hiện trạng được xác nhận |
|---|---|---|
| Tài khoản | backend/src/Ecommerce.API/Controllers/AuthController.cs; frontend/src/app/login/page.tsx | Có đăng nhập, đăng ký, gửi và xác thực OTP, reset và đổi mật khẩu. SMTP cần cấu hình. |
| Khám phá sản phẩm | backend/src/Ecommerce.BLL/Services/ProductService.cs; frontend/src/app/shop/page.tsx | Có tìm kiếm chuỗi, lọc và sắp xếp. Nhánh bestseller sắp theo ReviewCount. |
| Đặt hàng | frontend/src/components/customer/CustomerCheckoutModal.tsx; backend/src/Ecommerce.BLL/Services/OrderService.cs | Có tạo đơn, chọn COD/ONLINE và xử lý tồn kho trong service. Chưa xác minh thanh toán online qua cổng thực. |
| Theo dõi đơn | frontend/src/app/shop/my-orders/page.tsx; frontend/src/app/shop/track-order/page.tsx | Có giao diện và API đọc đơn, kiểm tra quyền ở service. Chưa đo cập nhật thời gian thực từ hãng vận chuyển. |
| Đánh giá | backend/src/Ecommerce.BLL/Services/ProductService.cs; backend/src/Ecommerce.API/Controllers/ProductsController.cs | Có tạo, đọc và phản hồi đánh giá. AddProductReviewAsync gán IsVerifiedPurchase = true, chưa kiểm tra đơn mua trong phương thức này. |
| Người bán, quản trị | frontend/src/app/inventory/page.tsx; frontend/src/app/orders/page.tsx; backend/src/Ecommerce.API/Controllers/AdminController.cs | Có mã quản lý hàng hóa, đơn và quản trị. Chưa kiểm thử toàn bộ kịch bản phân quyền trong lượt khảo sát. |
| Trợ lý AI | backend/src/Ecommerce.BLL/Services/AdditionalServices.cs; frontend/src/services/ai.service.ts | Có Gemini Stylist, sinh mô tả và cờ dự phòng. Chưa chứng minh độ chính xác hoặc tăng doanh số. |
| Sau bán | Các controller trong backend/src/Ecommerce.API/Controllers | Chưa tìm thấy endpoint nghiệp vụ trả hàng/hoàn tiền chuyên biệt trong tập controller đã đọc. |

### 2.2. Câu hỏi khảo sát

Người mua cần chọn đúng sản phẩm thời trang, hiểu giá phải trả và biết cách xử lý khi có vấn đề. Người bán cần dữ liệu đáng tin cậy để xử lý hàng hóa, đơn và phản hồi. Nhóm phát triển cần lựa chọn chức năng có thể triển khai và kiểm chứng trong đồ án.

Khảo sát tập trung vào cách thể hiện thông tin, cơ chế tạo niềm tin và sự liên tục của luồng trước, trong và sau mua hàng. Mục tiêu cải thiện là các tác vụ cụ thể của Aethelgard, có tiêu chí đánh giá tại mục 7.

## 3. Phương pháp và giới hạn khảo sát

### 3.1. Cách thu thập và ký hiệu

- **TL** — Thông tin trong tài liệu chính thức, được đọc trực tiếp hoặc qua nội dung công khai được công cụ tìm kiếm lập chỉ mục.
- **QS** — Nội dung trang công khai được công cụ đọc dưới dạng văn bản. Không tương đương thử nghiệm tương tác trên thiết bị.
- **PT** — Phân tích của người lập báo cáo dựa trên TL/QS hoặc mã nguồn. Bao gồm rủi ro có thể phát sinh trong một tình huống sử dụng.
- **CX** — Chưa xác minh trong lượt khảo sát.

Mỗi phát hiện dùng mã nguồn S01–S12 tại mục 8. Tất cả có ngày truy cập 19/11/2026. Các trang động và cá nhân hóa có thể thay đổi theo tài khoản, khu vực, thiết bị và thời điểm.

### 3.2. Phạm vi và mức độ bao phủ

| Nhóm tiêu chí | Cách thu thập | Giới hạn |
|---|---|---|
| Tài khoản, khôi phục | Hướng dẫn Shopee và danh mục trợ giúp Lazada | Chưa thao tác OTP trên tài khoản thật. |
| Trang chủ, mobile và điều hướng | Văn bản trang chủ Lazada; hướng dẫn Shopee; tài liệu TikTok | Chưa kiểm tra bố cục trực quan, điểm chạm hay responsive trên thiết bị. |
| Tìm kiếm, phân loại | Hướng dẫn mua hàng, Mall và đề xuất nội dung | Chưa benchmark truy vấn hoặc đo relevance. |
| Sản phẩm và độ tin cậy | Mall, chính sách đánh giá và thông tin trước mua | Chưa xác minh hàng hóa hoặc tính xác thực của đánh giá thực tế. |
| Giỏ, thanh toán, vận chuyển | Luồng tài liệu và nhóm hỗ trợ công khai | Chưa đặt hàng, trả tiền, nhận hàng hoặc kết nối hãng vận chuyển. |
| Đổi trả, hỗ trợ | Chính sách Shopee và mục trợ giúp của hai sàn còn lại | Chưa kiểm tra SLA xử lý vụ việc thực tế. |
| Công cụ người bán, AI | Danh mục tài liệu Seller/Academy và tài liệu đề xuất TikTok | Chưa đăng nhập Seller Center, chưa suy luận kiến trúc mô hình nội bộ. |

Trang chính sách Shopee S04 đọc được toàn văn. Một số trang Lazada chỉ trả nội dung một phần hoặc danh mục. Tài liệu TikTok S08 đọc qua chỉ mục tìm kiếm vì truy cập trực tiếp bị chuyển hướng/chặn; S09–S11 hỗ trợ bổ sung góc nhìn người bán. Các mục thiếu bằng chứng được ghi CX.

Hạn chế của sàn được trình bày dưới dạng điều kiện hoặc chi phí thao tác có nguồn, hoặc rủi ro PT. Báo cáo chưa có khảo sát định lượng người dùng, vì vậy không kết luận mức độ phổ biến của khó khăn hay xếp hạng chất lượng giữa các sàn.

## 4. Kết quả khảo sát từng sàn

### 4.1. Shopee — đối tượng khảo sát chính

**Chức năng và luồng tiêu biểu, TL.** Tài liệu hướng dẫn người mới cung cấp thông tin cần xem trước mua và quy trình chọn phân loại, số lượng, địa chỉ, vận chuyển, thanh toán. Người dùng có thể đặt từ giỏ hoặc mua ngay. Điều này giúp phân tách giai đoạn chọn hàng và xác nhận giao dịch. [S01]

**Ưu điểm học hỏi, PT.** Với khách mua áo lần đầu, hiển thị biến thể và thông tin đơn trước xác nhận giúp họ kiểm tra sai sót. Aethelgard nên giữ lựa chọn màu, size và giải thích khi biến thể hết hàng. Cơ chế học hỏi là đưa dữ kiện quyết định vào đúng bước mua.

**Tài khoản, TL.** Hướng dẫn khôi phục mật khẩu mô tả xác minh qua số điện thoại hoặc email rồi tạo mật khẩu mới. [S02]

**Ưu điểm và hạn chế, PT.** Luồng theo bước giúp người quên mật khẩu biết cần làm gì tiếp theo. Người mất quyền truy cập kênh liên kết có thể gặp khó khăn ở bước xác minh; lượt này chưa kiểm chứng quy trình hỗ trợ ngoại lệ. Đồ án cần hiển thị trạng thái gửi, hết hạn, gửi lại và lỗi để người dùng có hành động tiếp theo.

**Niềm tin và tìm kiếm, TL.** Shopee Mall có dấu hiệu nhận diện trên sản phẩm/gian hàng và bộ lọc riêng. [S03] Ưu điểm PT là khách ưu tiên nguồn hàng có thể thu hẹp lựa chọn. Rủi ro PT là nhãn uy tín có thể bị hiểu như bảo đảm cho mọi tình huống; đồ án cần giải thích tiêu chí cấp nhãn và quản trị quyền thay đổi.

**Sau bán, TL.** Chính sách trả hàng/hoàn tiền quy định điều kiện, bằng chứng và phạm vi áp dụng. Với COD/chuyển khoản, người mua cần liên kết phương thức nhận hoàn tiền hợp lệ. [S04]

**Hạn chế có điều kiện, PT.** Khách bắt đầu khiếu nại sau giao dịch có thể phải bổ sung kênh nhận tiền và bằng chứng. Đây là chi phí thủ tục, chưa phải kết luận về thời gian xử lý thực tế. Hướng cải thiện là checklist tài liệu, trạng thái hồ sơ và lịch sử trao đổi ngay trong đơn.

**Hỗ trợ, TL.** Trung tâm trợ giúp phân biệt tìm bài hướng dẫn với tra cứu dữ liệu riêng của đơn và trao đổi trực tiếp. [S05] Ưu điểm PT là tài liệu tự phục vụ; bất tiện PT là khách hỏi “đơn tôi ở đâu” cần sang đúng công cụ. Aethelgard nên dẫn thẳng từ bài trợ giúp đến đơn đang xét sau khi xác thực.

### 4.2. Lazada — điều hướng và tổ chức thông tin dịch vụ

**QS trang công khai.** Trang chủ có lối đăng nhập/đăng ký, theo dõi đơn, chăm sóc khách hàng, LazMall, ngành hàng và liên kết hướng dẫn mua, giao hàng, đổi trả. [S06]

**Ưu điểm, PT.** Khách mới có nhiều điểm vào theo mục đích. Với đồ án thời trang, nhóm có thể tổ chức menu theo mua sắm, đơn mua và hỗ trợ để khách quay lại tác vụ.

**Hạn chế/rủi ro, PT.** Khi ưu đãi, thương hiệu và danh mục cùng xuất hiện, khách đã biết món cần mua có thể phải bỏ qua nội dung khám phá. Chưa có đo lường để kết luận giao diện gây quá tải. Đề xuất cho Aethelgard là giữ tìm kiếm và bộ lọc ở vị trí rõ, đo thời gian hoàn thành tác vụ với người dùng thử.

**TL hỗ trợ.** Trung tâm trợ giúp tổ chức nhóm giỏ/thanh toán, tài khoản, giao hàng, hủy và trả hàng/hoàn tiền. [S07] Điều này là cơ sở tham khảo phân loại hỗ trợ, chưa chứng minh từng luồng giao dịch hoạt động như thế nào.

**TL tài khoản.** Hướng dẫn địa chỉ chỉ ra khu vực quản lý thông tin giao hàng của đơn và sổ địa chỉ. [S12] Ưu điểm PT là có nơi quản lý dữ liệu nhận hàng. Rủi ro PT là khách nhầm sửa sổ địa chỉ với sửa đơn đã đặt; đồ án cần giữ địa chỉ của đơn như dữ liệu tại thời điểm giao dịch và giải thích phạm vi cập nhật.

**Khoảng trống khảo sát.** Luồng reset OTP, bộ lọc cụ thể, chính sách đánh giá đã mua, quyền lợi LazMall chi tiết và công cụ tồn kho Seller Center chưa được thử hoặc xác minh đủ trong lượt này. Tính năng AI riêng tại Việt Nam cũng là CX. Báo cáo không dùng những mục này để chấm lợi thế so sánh.

### 4.3. TikTok Shop — khám phá qua nội dung và chất lượng người bán

**TL khám phá.** Tài liệu TikTok mô tả sản phẩm có thể được khám phá qua bảng tin, tìm kiếm và Tab Cửa hàng; trải nghiệm có yếu tố cá nhân hóa. [S08]

**Ưu điểm, PT.** Khách chưa xác định phong cách có thể tìm ý tưởng từ nội dung. Aethelgard có thể học cách gắn nội dung phối đồ với các sản phẩm còn hàng, dùng catalog hiện có làm cơ sở.

**Hạn chế/rủi ro, PT.** Khách tìm đúng thuộc tính có thể cần rời luồng nội dung để so giá, size và thông số. Chưa kiểm nghiệm số thao tác hoặc thời gian thực tế. Giải pháp phù hợp đồ án là giữ điểm vào tìm kiếm có cấu trúc và giải thích gợi ý; chưa cần triển khai livestream hoặc hệ thống đề xuất quy mô lớn.

**TL vận hành.** Academy có nhóm hướng dẫn đăng ký, đăng và quản lý sản phẩm, đơn hàng, vận chuyển. [S09] Tài liệu đóng gói hướng dẫn người bán dùng danh sách đóng gói và đối chiếu biến thể. [S10]

**Ưu điểm và rủi ro, PT.** Với người bán xử lý nhiều size, danh sách theo đơn hỗ trợ đối chiếu. Sai biến thể vẫn có thể phát sinh khi thông tin đầu vào thiếu. Đồ án nên bắt buộc chọn biến thể và kiểm tra tồn tại backend, rồi cung cấp phiếu chuẩn bị hàng đơn giản.

**TL đánh giá.** Chính sách đánh giá liên hệ phản hồi với sản phẩm đã mua và nhận hàng, cho phép một số tình huống phản hồi sau bán. [S11] Bài học PT là nhãn mua hàng cần chứng cứ từ đơn. Repo hiện gán nhãn tự động, nên cần ưu tiên sửa trước khi dùng đánh giá làm tín hiệu uy tín.

**Khoảng trống khảo sát.** Luồng khôi phục tài khoản, phương thức thanh toán đang hỗ trợ theo từng tài khoản Việt Nam và điều kiện trả hàng chi tiết là CX. Chưa đánh giá thuật toán nội bộ hay khẳng định sàn dùng một mô hình AI cụ thể.

## 5. Bảng so sánh theo cùng tiêu chí

Các ô ghi tên tính năng thể hiện bằng chứng trong tài liệu/trang công khai, chưa phải xác nhận đã trải nghiệm giao dịch.

| Tiêu chí | Shopee | Lazada | TikTok Shop |
|---|---|---|---|
| Đăng ký/đăng nhập | Tài khoản là điều kiện đặt hàng S01 | Có lối vào trên trang chủ S06 | Academy có đăng ký người bán S09; người mua CX |
| Quên mật khẩu | Có hướng dẫn xác minh S02 | CX luồng chi tiết | CX luồng chi tiết |
| Trang chủ, mobile | Có luồng web/app trong tài liệu S01 | Có ngành hàng và liên kết dịch vụ S06 | Bảng tin, tìm kiếm, Tab Cửa hàng theo tài liệu S08 |
| Tìm kiếm, bộ lọc | Bộ lọc Mall S03 | CX bộ lọc cụ thể | Có tìm kiếm, CX chất lượng kết quả S08 |
| Trang sản phẩm | Thông tin trước mua và biến thể S01 | CX trang chi tiết trong lượt này | Có quy tắc đánh giá theo sản phẩm S11; bố cục CX |
| Uy tín và đánh giá | Nhận diện Mall S03; dữ liệu đánh giá S01 | Có khu vực LazMall S06; điều kiện nhãn CX | Đánh giá liên hệ mua/nhận hàng S11 |
| Giỏ và đặt hàng | Có quy trình có bước xác nhận S01 | Có nhóm giỏ/thanh toán S07; thao tác CX | CX checkout thực tế |
| Thanh toán | Chọn tại bước xác nhận S01; điều kiện từng cách CX | Có mục phương thức S06; điều kiện từng cách CX | CX phương thức theo tài khoản |
| Vận chuyển, theo dõi | Lựa chọn vận chuyển S01; tích hợp hãng CX | Theo dõi đơn và nhóm giao hàng S06–S07 | Tài liệu chuẩn bị, đóng gói S09–S10 |
| Đổi trả, hỗ trợ | Chính sách và trợ giúp riêng S04–S05 | Nhóm sau bán S07; điều kiện chi tiết CX | Có nội dung sau bán trong chính sách đánh giá S11; quy trình chi tiết CX |
| Quản lý hàng/đơn | CX công cụ người bán trong lượt này | CX công cụ người bán trong lượt này | Nhóm hướng dẫn và phiếu đóng gói S09–S10 |
| Cá nhân hóa hoặc AI | CX công nghệ AI cụ thể | Có mục gợi ý S06; cơ chế CX | Tài liệu mô tả cá nhân hóa S08; mô hình cụ thể CX |

## 6. Bài học áp dụng và bảng ánh xạ

### 6.1. Ưu điểm nên học hỏi

Tập trung vào thông tin quyết định mua, xác minh nguồn tín hiệu uy tín và liên kết hỗ trợ với ngữ cảnh đơn hàng. Nội dung gợi ý phối đồ nên nối được với catalog và trạng thái tồn kho.

Các hạn chế được rút ra thành bài toán thiết kế cho dự án. Chưa có thử nghiệm đối chứng để kết luận Aethelgard tốt hơn các sàn về tốc độ, chuyển đổi hoặc hài lòng.

### 6.2. Ánh xạ phát hiện sang yêu cầu dự án

| Phát hiện khảo sát | Bằng chứng | Bài học hoặc vấn đề | Giải pháp cho dự án | Hiện trạng trong repo | Ưu tiên | Tiêu chí nghiệm thu |
|---|---|---|---|---|---|---|
| Phân biệt xác minh và tạo mật khẩu | S02, TL | Người quên mật khẩu cần biết bước hiện tại | FR01 hiển thị trạng thái và lỗi, giữ OTP tới lúc reset | Có API và luồng UI | Cao | Mã sai/hết hạn bị từ chối; reset trống không đổi hash; mã đã dùng bị từ chối |
| Có dữ liệu số bán trước mua | S01, TL | Đánh giá và số bán là tín hiệu khác nhau | FR02 tính bán chạy từ lượng hàng ở đơn đủ điều kiện | bestseller dùng ReviewCount | Cao | Bộ dữ liệu A có nhiều đánh giá, B bán nhiều hơn cho kết quả B đứng trước |
| Đánh giá liên hệ đơn mua | S11, TL | Nhãn uy tín phải có căn cứ | FR03 kiểm tra đơn đã giao chứa sản phẩm của người đánh giá | IsVerifiedPurchase đang gán true | Cao | Người chưa mua không nhận nhãn; người mua đã nhận có nhãn |
| Kiểm tra thông tin trước đặt | S01, TL | Người mua cần hiểu tổng tiền | FR04 đối chiếu báo giá và tính tiền tại backend | Có checkout và tính tổng ở service | Cao | Sửa giá phía client không đổi tổng server; mọi khoản cộng được hiển thị |
| Kiểm tra biến thể khi chuẩn bị đơn | S10, TL | Sai size/màu ảnh hưởng giao hàng | FR05 dùng variant ID và kiểm tra tồn, in phiếu theo đơn | Service tìm biến thể bằng chuỗi Specs | Cao | Hai biến thể gần tên không bị chọn nhầm; hàng hết bị chặn |
| Hồ sơ sau bán có điều kiện | S04, TL | Bằng chứng và nơi nhận tiền cần rõ | FR06 yêu cầu sau bán có trạng thái và lịch sử | Chưa thấy API chuyên biệt | Trung bình | Hồ sơ có lý do, bằng chứng, người xử lý; truy cập chéo bị chặn |
| Hỗ trợ chia theo chủ đề | S05, S07, TL | Khách dễ hỏi sai kênh | FR07 trợ giúp ngay trên đơn với đường dẫn rõ | Có trang theo dõi; chưa thấy trung tâm hồ sơ | Trung bình | Từ đơn tới hướng dẫn liên quan tối đa 2 thao tác trong kịch bản thử |
| Tách dữ liệu địa chỉ theo ngữ cảnh | S12, TL | Sửa sổ địa chỉ có thể bị hiểu nhầm | FR08 chụp địa chỉ giao khi tạo đơn | Order có ShippingAddress | Trung bình | Đổi hồ sơ không thay địa chỉ đơn cũ |
| Khám phá sản phẩm qua nội dung | S08, TL | Gợi ý cần gắn sản phẩm mua được | FR09 lọc tồn và giải thích nguồn gợi ý | Có Gemini và fallback | Trung bình | Tập 20 ca gồm hết hàng, timeout, thiếu dữ kiện đều cho nguồn rõ và liên kết hợp lệ |
| Nhận diện nguồn hàng | S03, TL | Huy hiệu cần được quản trị | FR10 quản lý tiêu chí, lịch sử cấp/thu hồi nhãn | Có IsMallVerified trong User | Trung bình | Seller không tự cấp nhãn; Admin có lịch sử thao tác |

## 7. Yêu cầu và kế hoạch ưu tiên

### 7.1. MVP — ưu tiên tính đúng của giao dịch và thông tin

**Đợt A — FR01, FR02, FR03.** Phụ thuộc dữ liệu User, OrderItem, OrderStatus và Review hiện có. Hoàn thiện kiểm thử vòng đời OTP; định nghĩa đơn nào được tính số bán; kiểm tra liên hệ người dùng–đơn–sản phẩm khi cấp nhãn. Trước khi sửa schema hoặc hợp đồng API, nhóm cần thống nhất kế hoạch migration cho dữ liệu cũ. Đánh giá cũ chưa có đơn liên kết giữ trạng thái chưa xác minh.

**Đợt B — FR04, FR05, FR08.** Phụ thuộc DTO giỏ, biến thể và transaction đặt hàng. Dùng ID biến thể thay cho so khớp chuỗi, tính lại giá trên server và lưu dữ kiện đơn tại thời điểm đặt. Kiểm tra đồng thời với một đơn vị hàng tồn để xác định khả năng ngăn bán vượt tồn. Đây là tiêu chí đề xuất, chưa có kết quả chạy trong báo cáo.

| Mã | Yêu cầu bổ sung | Cách kiểm chứng đề xuất |
|---|---|---|
| NFR01 | Bảo vệ dữ liệu đơn và yêu cầu sau bán | Customer A gọi ID của B bị từ chối; Seller chỉ đọc dữ liệu thuộc phạm vi được phân quyền |
| NFR02 | Trải nghiệm nhập liệu trên mobile | Thử rộng 360, 390 và 768 px; không tràn ngang; dán đủ 6 số OTP; lỗi gắn đúng trường |
| NFR03 | Hiệu ứng xác thực hướng tới 60 fps | Ghi trace trên Chrome, màn hình 60 Hz và thiết bị ghi rõ; đo khung hình vượt 16,7 ms trong từng tác vụ; báo tỷ lệ thay vì cam kết tuyệt đối |
| NFR04 | Khả năng khôi phục lỗi | Mô phỏng timeout API/email; giữ dữ liệu không nhạy cảm cần thiết; hiển thị lỗi và cho thử lại |
| NFR05 | Truy xuất bằng chứng | Yêu cầu quan trọng liên kết nguồn khảo sát, file mã và test nghiệm thu tương ứng |

### 7.2. Phần mở rộng

**FR06 và FR07 — ưu tiên Trung bình.** Bổ sung quản lý yêu cầu trả hàng theo đơn, lịch sử trạng thái và hỗ trợ theo ngữ cảnh. Demo có thể dùng hoàn tiền mô phỏng được ghi nhãn rõ. Cổng thanh toán thật, đối soát ngân hàng và chính sách vận hành cần thiết kế riêng.

**FR09 và FR10 — ưu tiên Trung bình.** Chuẩn hóa nội dung gợi ý và huy hiệu. Chưa cần huấn luyện mô hình mới. Bắt đầu từ kiểm tra thuộc tính, tồn kho và nguồn trả lời, kèm tập ca lỗi.

**Mở rộng khám phá nội dung — ưu tiên Thấp.** Chỉ cân nhắc video, livestream hoặc gợi ý học từ hành vi sau khi hoàn thành giao dịch và có dữ liệu phù hợp. Phụ thuộc hạ tầng nội dung, quyền sử dụng và cơ chế phản hồi người dùng.

### 7.3. Cách nghiệm thu báo cáo và chuyển giao

Lượt này chỉ kiểm tra tài liệu và đọc mã. Chưa chạy mới các test ứng dụng, benchmark tìm kiếm, đo FPS, mua hàng hoặc thử thanh toán thực tế. Các tiêu chí trong mục 6–7 là đầu vào để nhóm lập issue và kế hoạch kiểm thử.

Khi triển khai, mỗi yêu cầu cần một người phụ trách, phạm vi file, dữ liệu thử và minh chứng Pass/Fail. Sau khi có kết quả, cập nhật phiên bản báo cáo thay vì chuyển trạng thái chỉ dựa vào sự tồn tại của giao diện.

## 8. Tài liệu tham khảo và hồ sơ nguồn

Ngày truy cập tất cả nguồn dưới đây là **19/11/2026**. Các URL dẫn đến tài liệu do sàn cung cấp. Nội dung được diễn giải, không sao chép toàn bộ chính sách.

| Mã | Đơn vị và tài liệu | Phương thức, giới hạn |
|---|---|---|
| S01 | Shopee — Hướng dẫn mua/đặt hàng | Đọc toàn văn hướng dẫn công khai; chưa thao tác đặt đơn |
| S02 | Shopee — Đăng nhập khi quên mật khẩu | Nội dung chính thức được lập chỉ mục; chưa gửi OTP thật |
| S03 | Shopee — Shopee Mall là gì | Nội dung chính thức được lập chỉ mục; chỉ dùng nhận diện và bộ lọc |
| S04 | Shopee — Chính sách trả hàng và hoàn tiền | Đọc toàn văn; trang ghi hiệu lực 06/11/2026; không suy rộng mọi ngành hàng |
| S05 | Shopee — Tìm thông tin trong Trung tâm trợ giúp | Nội dung chính thức được lập chỉ mục |
| S06 | Lazada Việt Nam — Trang chủ | Đọc văn bản công khai; chưa kiểm tra bố cục trực quan hoặc trang cá nhân hóa |
| S07 | Lazada — Trung tâm trợ giúp | Nội dung lập chỉ mục của danh mục; mở trực tiếp không có phần văn bản đầy đủ |
| S08 | TikTok — Cách TikTok đề xuất nội dung | Nội dung chính thức được lập chỉ mục; truy cập trực tiếp tài liệu Shop gặp chuyển hướng/chặn |
| S09 | TikTok Shop Academy Việt Nam | Danh mục công khai về tài khoản, sản phẩm, đơn, vận chuyển |
| S10 | TikTok Shop — Đóng gói và dán nhãn | Hướng dẫn công khai; chưa thử Seller Center |
| S11 | TikTok Shop — Chính sách đánh giá khách hàng | Đọc toàn văn, có bản tiếng Việt được lập chỉ mục; dùng quy tắc liên hệ đơn mua |
| S12 | Lazada — Quản lý địa chỉ giao hàng | Nội dung chính thức được lập chỉ mục; chưa sửa địa chỉ thật |

### 8.1. URL đầy đủ

- **S01** — https://help.shopee.vn/portal/4/article/79180
- **S02** — https://help.shopee.vn/portal/4/article/79288-%5BT%C3%A0i-kho%E1%BA%A3n-Shopee%5D-L%C3%A0m-sao-t%C3%B4i-c%C3%B3-th%E1%BB%83-%C4%91%C4%83ng-nh%E1%BA%ADp-t%C3%A0i-kho%E1%BA%A3n-khi-qu%C3%AAn-m%E1%BA%ADt-kh%E1%BA%A9u
- **S03** — https://help.shopee.vn/portal/4/article/79090
- **S04** — https://help.shopee.vn/portal/4/article/77251
- **S05** — https://help.shopee.vn/portal/4/article/79643
- **S06** — https://www.lazada.vn/
- **S07** — https://helpcenter.lazada.vn/s/faq/category?categoryId=1000027284&hybrid=1&language=vi&m_station=BuyerHelp
- **S08** — https://support.tiktok.com/vi/using-tiktok/exploring-videos/how-tiktok-recommends-content
- **S09** — https://seller-vn.tiktok.com/university/home?tab=policy_center
- **S10** — https://seller-vn.tiktok.com/university/essay?default_language=en&knowledge_id=6091769578129169
- **S11** — https://seller-vn.tiktok.com/university/essay?knowledge_id=10013847
- **S12** — https://helpcenter.lazada.vn/s/faq/search?categoryId=1000027318&hybrid=1&keyword=C%C3%A1c+b%C6%B0%E1%BB%9Bc+c%E1%BA%ADp+nh%E1%BA%ADt+%C4%91%E1%BB%8Ba+ch%E1%BB%89+giao+h%C3%A0ng+v%C3%A0+t%C3%A0i+kho%E1%BA%A3n+ng%C3%A2n+h%C3%A0ng&language=vi&m_station=BuyerHelp&questionId=1000140973&terminal=pc&tsuCode=faq

### 8.2. Bằng chứng nội bộ

Các đường dẫn tại mục 2.1 đều tồn tại ở mốc khảo sát. Liên kết gốc để đối chiếu mã nguồn là https://github.com/longthan12334/He-thong-thuong-mai-ien-tu-tich-hop-AI/tree/479c120c43d0d5ac9817d2b209f4d482611c86b1 .

Các phát hiện quan trọng được đối chiếu tại ProductService.GetProductsAsync, ProductService.AddProductReviewAsync, OrderService.CreateOrderAsync, AuthController và ai.service.ts. Báo cáo chưa xác minh trạng thái triển khai production của repository.
