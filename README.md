# He-thong-thuong-mai-ien-tu-tich-hop-AI
# Hệ thống Thương mại Điện tử tích hợp Trí tuệ Nhân tạo (AI-Integrated E-Commerce System)

> Đề tài hệ thống thương mại điện tử toàn diện kết hợp các mô hình Deep Learning, Machine Learning và Large Language Models (LLM) nhằm tối ưu hóa trải nghiệm người dùng, tự động hóa vận hành và xây dựng môi trường mua sắm thông minh.

---

## 📑 Mục lục
1. [Giới thiệu dự án](#-giới-thiệu-dự-án)
2. [Mục tiêu dự án](#-mục-tiêu-dự-án)
3. [Các Module AI tích hợp cốt lõi](#-các-module-ai-tích-hợp-cốt-lõi)
4. [Kiến trúc hệ thống (Dự kiến)](#-kiến-trúc-hệ-thống)
5. [Công nghệ sử dụng](#-công-nghệ-sử-dụng)

---

## 🚀 1. Giới thiệu dự án
Bản chất hệ thống là một nền tảng mua sắm trực tuyến toàn diện, không chỉ cung cấp các chức năng cốt lõi của một trang thương mại điện tử thông thường (như quản lý sản phẩm, giỏ hàng, đơn hàng, thanh toán) mà còn được nhúng sâu các tính năng thông minh dựa trên trí tuệ nhân tạo. 

Dự án hướng tới việc giải quyết bài toán tự động hóa quy trình quản trị cho người bán và nâng cao trải nghiệm cá nhân hóa cho người mua.

---

## 🎯 2. Mục tiêu dự án

* **Nâng cao trải nghiệm khách hàng (User Experience):** 
  * Cung cấp công cụ tìm kiếm trực quan bằng hình ảnh (Visual Search).
  * Cá nhân hóa nội dung gợi ý sản phẩm dựa trên lịch sử hành vi.
  * Hỗ trợ giải đáp thắc mắc 24/7 thông qua trợ lý ảo thông minh.
* **Tối ưu hóa hiệu suất vận hành cho người bán (Merchant Optimization):** 
  * Tự động hóa việc sinh nội dung mô tả sản phẩm chuẩn SEO từ tên và thông số cơ bản.
  * Tự động tóm tắt hàng loạt đánh giá của khách hàng giúp quản trị viên nắm bắt phản hồi nhanh chóng.
* **Xây dựng môi trường mua sắm văn minh, an toàn:** 
  * Ứng dụng Xử lý ngôn ngữ tự nhiên (NLP) để tự động kiểm duyệt, phát hiện và ẩn các bình luận chứa từ ngữ nhạy cảm, thô tục hoặc spam.
* **Mục tiêu học thuật và kỹ thuật:** 
  * Ứng dụng thành công các mô hình AI hiện đại (LLM, CLIP, Vector Search, PhoBERT) vào thực tế.
  * Xây dựng kiến trúc phần mềm chuẩn mực (tách biệt khối AI Service và hệ thống E-commerce cốt lõi bằng kiến trúc Microservices/Modular Monolith) đảm bảo tính mở rộng và tối ưu tài nguyên.

---

## 🧠 3. Các Module AI tích hợp cốt lõi
Hệ thống hiện thực hóa mục tiêu thông qua **6 module AI chính**:

1. **Tự động tạo mô tả sản phẩm:** Dùng LLM (như Qwen/Llama qua Fine-tuning/Prompt Engineering) để biến tên và thông số kỹ thuật thành bài viết mô tả sản phẩm hấp dẫn.
2. **Cá nhân hóa và gợi ý thông minh:** Ứng dụng Vector Database kết hợp mô hình Embedding và Collaborative Filtering để tìm sản phẩm tương tự hoặc đề xuất theo lịch sử xem/mua.
3. **Chatbot trợ lý ảo thông minh (RAG):** Kết hợp kiến trúc Retrieval-Augmented Generation để trả lời chính xác chính sách đổi trả/bảo hành và tư vấn sản phẩm phù hợp.
4. **Tìm kiếm bằng hình ảnh (Visual Search):** Sử dụng mô hình thị giác máy tính (như CLIP) để người dùng upload ảnh chụp thực tế và tìm sản phẩm trùng khớp trong cửa hàng.
5. **Tóm tắt đánh giá sản phẩm:** Sử dụng công nghệ xử lý văn bản để tổng hợp hàng trăm nhận xét rời rạc thành các ý chính về ưu/nhược điểm.
6. **Kiểm duyệt nội dung tự động (Content Moderation):** Sử dụng mô hình phân loại văn bản tiếng Việt để tự động phát hiện và lọc bỏ các bình luận độc hại, thô tục.

---

## 🏗️ 4. Kiến trúc hệ thống
* **AI Service:** Đóng gói độc lập (thường sử dụng Python / FastAPI) để xử lý các tác vụ nặng về mô hình học máy.
* **Core E-commerce:** Quản lý nghiệp vụ bán hàng cốt lõi (Sản phẩm, Giỏ hàng, Đơn hàng, Thanh toán).
* **Giao tiếp:** Tương tác thông qua REST APIs hoặc bất đồng bộ qua Message Queue (nếu cần thiết cho các tác vụ xử lý hàng loạt).

---

## 🛠️ 5. Công nghệ sử dụng
* **AI / Deep Learning:** PyTorch, Hugging Face Transformers, PEFT/LoRA, CLIP, PhoBERT, Sentence-Transformers.
* **Vector Database:** Milvus / Qdrant / pgvector.
* **Backend & Framework:** FastAPI, Node.js / Java / PHP (tùy chọn cho E-commerce core).
