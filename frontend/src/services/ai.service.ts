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
};
