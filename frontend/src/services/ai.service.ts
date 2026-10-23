import apiClient from './api-client';

/**
 * AI Fashion Stylist — gọi endpoint Backend: GET /api/ai/recommend?query=&productId=
 * Khi Backend không phản hồi, trả về gợi ý dự phòng để giao diện khách không bị trống.
 */
export const aiService = {
  async getOutfitRecommendation(query: string, productId?: number): Promise<{ text: string; isFallback: boolean }> {
    try {
      const res = await apiClient.get('/ai/recommend', { params: { query, productId } });
      const raw: string = res.data?.recommendation || '';
      return { text: raw.replace(/^\[AI Fashion Stylist\]:\s*/i, '').trim(), isFallback: false };
    } catch {
      return {
        text:
          'Phối theo nguyên tắc High-Low: một item điểm nhấn cao cấp kết hợp với trang phục tối giản tông trung tính, ' +
          'thêm một phụ kiện kim loại hoặc kính râm gọng mảnh để hoàn thiện tổng thể.',
        isFallback: true,
      };
    }
  },

  async generateProductDescription(data: {
    productName: string;
    categoryName?: string;
    brand?: string;
    keywords?: string;
  }): Promise<{
    seoTitle: string;
    description: string;
    material: string;
    careInstructions: string;
  }> {
    try {
      const res = await apiClient.post('/ai/generate-description', data);
      return res.data;
    } catch {
      return {
        seoTitle: `${data.productName} — Bộ Sưu Tập Thời Trang Cao Cấp Aethelgard`,
        description: `Tuyệt phẩm ${data.productName} mang đến sự kết hợp hoàn mỹ giữa chất liệu thượng hạng và phong cách thanh lịch đương đại, khẳng định đẳng cấp độc bản của chủ nhân.`,
        material: 'Vải dệt cao cấp tuyển chọn đạt chuẩn chất lượng quốc tế',
        careInstructions: 'Bảo quản nơi thoáng mát, tránh ánh nắng trực tiếp và hóa chất tẩy rửa mạnh.',
      };
    }
  },
};
