# 🤖 TÀI LIỆU THIẾT KẾ & TÍCH HỢP TRÍ TUỆ NHÂN TẠO (AI SYSTEM SPECIFICATION)
## HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ THỜI TRANG CAO CẤP AETHELGARD MALL

---

## 📌 I. TỔNG QUAN & TẦM NHÌN ỨNG DỤNG AI

Trong ngành thương mại điện tử thời trang xa xỉ (Luxury & High-end Streetwear), hành vi mua sắm của khách hàng có sự khác biệt rõ rệt so với thương mại điện tử truyền thống:
1. **Không mua đơn lẻ, mua theo phong cách**: Khách hàng không chỉ tìm mua một chiếc áo hay đôi giày đơn thuần, mà họ tìm kiếm một tổng thể trang phục (Outfit / Lookbook) thể hiện được cá tính, đẳng cấp và phong cách sống thượng lưu.
2. **Kỳ vọng được tư vấn cá nhân hóa (Personal Styling)**: Khách hàng mong muốn có trải nghiệm tương tự như khi bước vào một Boutique thời trang Flagship tại Paris hay Milan, nơi có chuyên gia thời trang riêng (Fashion Stylist) đưa ra lời khuyên phối đồ theo từng sự kiện và vóc dáng.
3. **Thách thức của người bán (Sellers)**: Việc đăng bán các mặt hàng xa xỉ đòi hỏi nội dung mô tả sản phẩm phải có ngôn từ trau chuốt, giàu tính thẩm mỹ, nêu bật chất liệu thủ công và chuẩn hóa cấu trúc SEO.

Để giải quyết các bài toán trên, **Aethelgard Shopping Mall** đã tích hợp hệ thống Trí tuệ Nhân tạo toàn diện, biến AI thành trợ lý đắc lực cho cả hai nhóm người dùng trọng tâm:
* **Đối với Khách hàng**: Trợ lý thời trang cá nhân hóa **Aethelgard AI Stylist** (sử dụng Google Gemini AI) tư vấn phối đồ và gợi ý hoàn thiện set trang phục chéo danh mục.
* **Đối với Người bán**: Công cụ **AI Product Description Generator** tự động biên soạn nội dung mô tả sản phẩm sang trọng, tiêu đề chuẩn SEO và hướng dẫn bảo quản hàng hiệu.

---

## 🏗️ II. KIẾN TRÚC TỔNG THỂ HỆ THỐNG AI

Hệ thống AI được thiết kế theo mô hình lai (Hybrid AI Architecture), kết hợp giữa **Mô hình Ngôn ngữ Lớn (LLM - Google Gemini)** trên đám mây, **Bộ nhớ đệm phân tầng (In-Memory Cache)** và **Động cơ Phối đồ Theo Quy tắc (Heuristic Fallback Engine)**.

### 1. Sơ đồ Luồng Hoạt động Tổng thể

```
┌────────────────────────────────────────────────────────────────────────┐
│                      GIAO DIỆN NGƯỜI DÙNG (FRONTEND)                   │
│                                                                        │
│   [AIStylistPanel.tsx]           [ProductEditorModal.tsx]              │
│    (Tư vấn phối đồ cho khách)     (Tạo nội dung bán hàng cho Seller)   │
└──────────────────┬─────────────────────────────┬───────────────────────┘
                   │                             │
        GET /api/ai/recommend         POST /api/ai/generate-description
                   │                             │
┌──────────────────▼─────────────────────────────▼───────────────────────┐
│                   MÁY CHỦ WEB API (.NET 10 BACKEND)                    │
│                                                                        │
│   • Controllers: StoresAndSeedControllers.cs                           │
│   • Services: AdditionalServices.cs (BLL)                              │
│   • Caching: IMemoryCache (Key: ai_outfit_..., ai_desc_...)            │
└──────────────────┬─────────────────────────────┬───────────────────────┘
                   │                             │
         (Nếu có trong Cache)           (Nếu chưa có Cache)
                   │                             │
            [Trả kết quả ngay]           [Kiểm tra API Key]
            (Độ trễ < 10ms)                      │
                                   ┌─────────────┴─────────────┐
                                   │                           │
                          [Có GEMINI_API_KEY]         [Không có Key / Mất mạng]
                                   │                           │
                       Gọi Google Gemini API          Kích hoạt Heuristic Fallback
                      (gemini-3-flash-preview)      (Quy tắc thời trang định sẵn)
                                   │                           │
                                   └─────────────┬─────────────┘
                                                 │
                                     Lưu Cache 6h / 1h & Trả về
```

### 2. Các Thành Phần Kỹ Thuật Chính
* **Frontend Components**:
  - `AIStylistPanel.tsx`: Giao diện tương tác tư vấn phối đồ cho khách hàng trên trang chi tiết sản phẩm.
  - `ProductEditorModal.tsx`: Hộp thoại quản trị sản phẩm tích hợp công cụ "Gợi ý mô tả AI" cho người bán.
  - `ai.service.ts`: Client giao tiếp API, xử lý định dạng chuỗi và fallback an toàn ở tầng Client.
* **Backend Services**:
  - `StoresAndSeedControllers.cs`: Tiếp nhận request từ Client, kiểm tra tham số đầu vào.
  - `AdditionalServices.cs`: Thực thi logic nghiệp vụ AI, xây dựng câu lệnh chỉ dẫn (Prompt Engineering), gọi Google Gemini REST API và quản lý vòng đời Cache.
  - `IMemoryCache`: Bộ đệm trong RAM lưu trữ kết quả để tái sử dụng, tối ưu chi phí và tăng tốc độ phản hồi.

---

## 👔 III. PHÂN HỆ 1: TRỢ LÝ PHỐI ĐỒ CÁ NHÂN HÓA (AETHELGARD AI STYLIST)

Trợ lý **Aethelgard AI Stylist** là tính năng độc quyền được tích hợp trực tiếp tại trang chi tiết sản phẩm (`/product-detail/[id]`).

### 1. Cơ chế Tiếp nhận Ngữ cảnh (Context-Aware Prompting)
Khi người dùng bấm xem một sản phẩm bất kỳ (ví dụ: *Giày Sneaker Gucci Ace Web Leather Original*), hệ thống tự động tổng hợp toàn bộ thông tin của sản phẩm đó để đưa vào ngữ cảnh phân tích:
* **Tên sản phẩm**: `Gucci Ace Web Leather Original`
* **Bộ sưu tập / Thương hiệu**: `Gucci Epilogue`
* **Giá bán niêm yết**: `18,900,000 đ`
* **Chất liệu & Mô tả**: `Da bò Nappa cao cấp Ý, dải ruy băng Web xanh đỏ kinh điển`
* **Nhu cầu / Câu hỏi của khách hàng**: Lựa chọn qua các thẻ gợi ý sẵn (Prompt Chips) hoặc câu hỏi tự do.

### 2. Bộ Thẻ Phong Cách Định Sẵn (Prompt Chips)
Giao diện cung cấp sẵn các nút chọn nhanh đại diện cho các phong cách thịnh hành trong giới thượng lưu:
1. **Dạ tiệc thượng lưu (Gala & Formal Event)**: Tư vấn phong cách lịch thiệp, tôn vinh nét quý phái khi tham gia sự kiện trang trọng.
2. **Dạo phố cuối tuần (Weekend Streetwear)**: Tư vấn cách phối đồ thoải mái, phóng khoáng nhưng vẫn giữ trọn nét sành điệu.
3. **Phong cách Smart Casual (Công sở hiện đại)**: Kết hợp hài hòa giữa sự thanh lịch công sở và tính tiện dụng đương đại.
4. **Set đồ mùa đông ấm áp (Winter Capsule)**: Hướng dẫn phối đồ nhiều lớp (Layering) với áo khoác len dạ, áo măng tô và phụ kiện giữ ấm.
5. **Tone-sur-tone lịch lãm**: Phong cách phối màu đồng điệu tạo chiều sâu thị giác tinh tế.

### 3. Khung Chỉ dẫn Mẫu cho Google Gemini (System Prompt)
Đoạn mã Prompt được tinh chỉnh chuyên biệt trong [`AdditionalServices.cs`](file:///c:/Users/ADMIN/CDTH/He-thong-thuong-mai-ien-tu-tich-hop-AI/backend/src/Ecommerce.BLL/Services/AdditionalServices.cs):
```text
Bạn là Aethelgard AI Stylist - trợ lý cố vấn thời trang cá nhân của sàn thương mại điện tử xa xỉ Aethelgard Shopping Mall.
Bạn am hiểu sâu sắc về văn hóa thời trang cao cấp (Luxury, Haute Couture, Streetwear, Smart Casual, Old Money).
Sản phẩm khách hàng đang quan tâm: '{product.Name}'.
- Bộ sưu tập/Thương hiệu: {product.CollectionName}
- Giá bán: {product.BasePrice:N0} đ
- Mô tả: {product.Description}
Yêu cầu / Câu hỏi của khách hàng: "{query}"

Hướng dẫn trả lời:
- Đưa ra lời tư vấn phong cách tinh tế, lịch thiệp, sang trọng, mang tính truyền cảm hứng.
- Gợi ý chi tiết cách phối trang phục (áo, quần/váy), màu sắc hài hòa và phụ kiện (giày, kính, túi xách, đồng hồ) đi kèm.
- Ngắn gọn trong khoảng 2-4 câu, trình bày súc tích, chuyên nghiệp bằng tiếng Việt.
```

### 4. Đề Xuất "Hoàn Thiện Set Đồ" Chéo Danh Mục (Complementary Outfits)
Song song với lời tư vấn văn bản, thuật toán AI tự động quét danh mục sản phẩm của sàn để gợi ý các sản phẩm bổ trợ tạo thành **Full Set Outfit hoàn chỉnh**:
* **Quy tắc phối chéo danh mục**:
  - Đang xem **Giày Sneaker / Loafer** $\rightarrow$ Gợi ý phối cùng **Áo khoác / Hoodie** và **Kính mát / Phụ kiện**.
  - Đang xem **Áo khoác / Áo nỉ** $\rightarrow$ Gợi ý phối cùng **Quần nỉ / Quần âu** và **Giày thể thao**.
  - Đang xem **Túi xách cao cấp** $\rightarrow$ Gợi ý phối cùng **Áo măng tô / Blazer** và **Thắt lưng da**.
* **Trải nghiệm mua sắm tiện lợi**:
  - Mỗi sản phẩm bổ trợ được hiển thị rõ ảnh, tên thương hiệu và giá bán.
  - Nút **"Thêm trọn bộ vào giỏ hàng"**: Cho phép khách hàng thêm toàn bộ các sản phẩm trong outfit vào giỏ hàng chỉ trong 1 thao tác duy nhất, nâng cao trải nghiệm mua sắm và gia tăng giá trị đơn hàng trung bình (AOV).

---

## ✍️ IV. PHÂN HỆ 2: CÔNG CỤ SÁNG TẠO NỘI DUNG BÁN HÀNG CHO SELLER (AI PRODUCT CONTENT GENERATOR)

Phân hệ dành riêng cho các chủ gian hàng và thương hiệu đối tác khi tạo mới hoặc chỉnh sửa sản phẩm (`ProductEditorModal.tsx`).

### 1. Bài toán Thực tế
Người bán thường gặp khó khăn trong việc:
* Viết tiêu đề sản phẩm sao cho vừa chuẩn SEO vừa thể hiện được chất xa xỉ của thương hiệu.
* Soạn thảo phần mô tả cuốn hút, làm nổi bật được tay nghề thủ công (Craftsmanship) và cảm hứng thiết kế.
* Đưa ra các hướng dẫn bảo quản chính xác cho từng loại chất liệu (da cừu non, nỉ bông cao cấp, denim selvedge Nhật...).

### 2. Cơ chế Hoạt động
Người bán chỉ cần nhập các thông tin cơ bản:
* Tên sản phẩm (ví dụ: *Túi Xách Lady Dior Medium Cannage*)
* Danh mục: *Túi xách cao cấp*
* Thương hiệu: *Christian Dior*
* Điểm nổi bật: *Da cừu non, họa tiết chần bông Cannage, charm D.I.O.R mạ vàng*

Bấm nút **"Gợi ý mô tả AI"**, Backend kích hoạt endpoint `POST /api/ai/generate-description` và trả về kết quả định dạng JSON có cấu trúc:
```json
{
  "seoTitle": "Túi Xách Lady Dior Medium Cannage Lambskin — Đỉnh Cao Thời Trang Di Sản Pháp",
  "description": "Chiếc túi biểu tượng gắn liền với Công nương Diana, được chế tác thủ công hoàn mỹ từ da cừu non cao cấp chần bông motif Cannage kinh điển. Từng đường may sắc nét kết hợp bộ phụ kiện charm D.I.O.R mạ vàng sang trọng tạo nên một tuyệt tác vượt thời gian, khẳng định vị thế quý phái của chủ nhân trong mọi buổi dạ tiệc thượng lưu.",
  "material": "Da cừu non (Lambskin) cao cấp Cannage, phụ kiện kim loại mạ vàng chống oxy hóa",
  "careInstructions": "Vệ sinh chuyên dụng bằng khăn mềm chuyên biệt, bảo quản trong túi vải thoáng khí tại nơi khô ráo, tránh ánh nắng trực tiếp và hóa chất tẩy rửa mạnh."
}
```
Các trường dữ liệu tự động điền vào form, giúp người bán hoàn thiện bài đăng chỉ trong vài giây.

---

## ⚙️ V. CẤU HÌNH, TỐI ƯU HIỆU NĂNG & CHIẾN LƯỢC DỰ PHÒNG

### 1. Cấu hình Khóa API & Biến Môi Trường
Hệ thống sử dụng mô hình thế hệ mới nhất của Google: **`gemini-3-flash-preview`** (hoặc `gemini-1.5-flash`), nổi bật với tốc độ phản hồi tính bằng mili-giây và chi phí vận hành tối ưu.

* **Cách 1: Khai báo qua Biến môi trường hệ điều hành**:
  ```powershell
  # Thiết lập trên PowerShell Windows
  $env:GEMINI_API_KEY="AIzaSyYourSecretApiKeyHere"
  ```
* **Cách 2: Khai báo trong cấu hình ứng dụng (`appsettings.json`)**:
  ```json
  "Gemini": {
    "ApiKey": "AIzaSyYourSecretApiKeyHere",
    "Model": "gemini-3-flash-preview"
  }
  ```
* **Cách 3: Triển khai qua Docker Compose (`docker-compose.yml`)**:
  ```yaml
  environment:
    - Gemini__ApiKey=${GEMINI_API_KEY:-}
    - Gemini__Model=gemini-3-flash-preview
  ```

### 2. Chiến lược Tối ưu Bộ nhớ Đệm (In-Memory Caching)
Mỗi truy vấn phối đồ AI được tạo một khóa cache duy nhất:
$$\text{CacheKey} = \text{ai\_outfit\_\{productId\}\_\{normalizedQuery\}}$$

* **Thời gian lưu Cache (TTL)**:
  - Kết quả trả về từ Gemini AI: **6 giờ** (đảm bảo phản hồi nhanh cho nhiều khách xem cùng một mặt hàng).
  - Kết quả trả về từ Heuristic Fallback: **1 giờ**.
* **Lợi ích**:
  - Giảm thiểu hơn **85%** lượng request gửi tới Google Gemini API.
  - Tốc độ phản hồi đạt **$< 10\text{ ms}$** khi trúng Cache (Cache Hit).
  - Hoàn toàn triệt tiêu nguy cơ chạm giới hạn tần suất gọi API (Rate Limit Exceeded).

### 3. Đảm Bảo Tính Sẵn Sàng 100% (High Availability Heuristic Fallback)
Hệ thống tuân thủ nguyên tắc **Zero-downtime & Fail-safe**:
* Nếu máy chủ chưa cấu hình API Key, hoặc mạng internet bị gián đoạn, hoặc Google Gemini API gặp sự cố:
  - Hệ thống **không bao giờ trả về lỗi 500** hoặc để giao diện người dùng bị đơ / rỗng.
  - Backend tự động kích hoạt bộ sinh gợi ý thông minh dựa trên phân loại sản phẩm và thương hiệu.
  - Frontend (`ai.service.ts`) được trang bị thêm lớp bắt lỗi độc lập trả về gợi ý phong cách High-Low kinh điển nếu Backend không phản hồi.

---

## 🚀 VI. LỘ TRÌNH ĐỘT PHÁ CÔNG NGHỆ AI TIẾP THEO (AI ROADMAP)

Để tiếp tục nâng tầm Aethelgard Mall thành kỳ lân công nghệ trong mảng Fashion E-Commerce, hệ thống định hướng 3 nâng cấp mang tính đột phá:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LỘ TRÌNH NÂNG CẤP AI TRONG TƯƠNG LAI            │
├────────────────────┬────────────────────┬──────────────────────────────┤
│    GIAI ĐOẠN 1     │    GIAI ĐOẠN 2     │         GIAI ĐOẠN 3          │
│   (Vector Search)  │  (Virtual Try-On)  │    (Multimodal Agent)        │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ • Tích hợp Vector  │ • Thử đồ ảo 3D     │ • Trợ lý AI đa phương thức   │
│   Database         │   (Virtual Try-On) │   (Hỏi đáp bằng hình ảnh)    │
│ • Kiến trúc RAG    │ • Mô hình IDM-VTON │ • Tự động nhận diện đồ trong │
│   chuyên sâu       │   ướm đồ lên ảnh   │   ảnh chụp đường phố         │
│ • Tìm kiếm ngữ     │   thực của khách   │ • Chatbot hội thoại thông    │
│   nghĩa thông minh │ • Đánh giá độ vừa  │   minh qua giọng nói         │
└────────────────────┴────────────────────┴──────────────────────────────┘
```

1. **Kiến trúc RAG (Retrieval-Augmented Generation) & Vector Database**:
   - Sử dụng **pgvector** hoặc **Qdrant** nhúng toàn bộ thuộc tính, mô tả và lịch sử đánh giá của 180+ sản phẩm thành Vector Embeddings.
   - Cho phép trợ lý AI trả lời các câu hỏi phức tạp mang tính ngữ cảnh cao: *"Tôi có chuyến công tác 3 ngày tại Sa Pa mùa đông này, hãy chuẩn bị cho tôi danh sách 5 món đồ vừa ấm vừa sang trọng"*.
2. **Phòng Thử Đồ Ảo (AI Virtual Try-On)**:
   - Ứng dụng mô hình AI tạo sinh hình ảnh tiên tiến (như **IDM-VTON** hoặc **Stable Diffusion XL**).
   - Khách hàng tải ảnh chụp vóc dáng bản thân; hệ thống tự động tách phom người và ghép chiếc áo/quần lên ảnh với độ chân thực về nếp gấp vải và ánh sáng tự nhiên.
3. **Trợ Lý Đa Phương Thức (Multimodal Fashion Agent)**:
   - Khách hàng chụp ảnh một bộ trang phục bắt gặp trên đường phố hoặc tạp chí thời trang và tải lên hệ thống.
   - AI thị giác máy tính (Vision AI) tự động nhận diện thương hiệu, kiểu dáng và tìm kiếm các sản phẩm tương tự có sẵn trên sàn Aethelgard Mall để khách đặt mua ngay.
