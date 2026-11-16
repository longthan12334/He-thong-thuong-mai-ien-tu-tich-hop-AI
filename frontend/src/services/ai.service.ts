import apiClient from './api-client';

const fallbackOutfit = {
  text:
    'Phối theo nguyên tắc High-Low: một item điểm nhấn cao cấp kết hợp với trang phục tối giản tông trung tính, ' +
    'thêm một phụ kiện kim loại hoặc kính râm gọng mảnh để hoàn thiện tổng thể.',
  isFallback: true,
};

/**
 * AI Fashion Stylist — gọi endpoint Backend: GET /api/ai/recommend?query=&productId=
 * Khi Backend không phản hồi, trả về gợi ý dự phòng để giao diện khách không bị trống.
 */
export const aiService = {
  async getOutfitRecommendation(query: string, productId?: number, signal?: AbortSignal): Promise<{ text: string; isFallback: boolean }> {
    try {
      const res = await apiClient.get('/ai/recommend', { params: { query, productId }, signal });
      const raw: unknown = res.data?.recommendation;
      if (typeof raw === 'string') {
        const text = raw.replace(/^\[AI Fashion Stylist\]:\s*/i, '').trim();
        if (text) return { text, isFallback: res.data?.isFallback === true };
      }
      return fallbackOutfit;
    } catch {
      return fallbackOutfit;
    }
  },

  async generateProductDescription(data: {
    productName: string;
    categoryName?: string;
    brand?: string;
    keywords?: string;
  }, signal?: AbortSignal): Promise<{
    seoTitle: string;
    description: string;
    material: string;
    careInstructions: string;
    isFallback?: boolean;
  }> {
    try {
      const res = await apiClient.post('/ai/generate-description', data, { signal });
      return res.data;
    } catch {
      return {
        isFallback: true,
        seoTitle: `${data.productName} — Bộ Sưu Tập Thời Trang Cao Cấp Aethelgard`,
        description: `Tuyệt phẩm ${data.productName} mang đến sự kết hợp hoàn mỹ giữa chất liệu thượng hạng và phong cách thanh lịch đương đại, khẳng định đẳng cấp độc bản của chủ nhân.`,
        material: 'Vải dệt cao cấp tuyển chọn đạt chuẩn chất lượng quốc tế',
        careInstructions: 'Bảo quản nơi thoáng mát, tránh ánh nắng trực tiếp và hóa chất tẩy rửa mạnh.',
      };
    }
  },
};
