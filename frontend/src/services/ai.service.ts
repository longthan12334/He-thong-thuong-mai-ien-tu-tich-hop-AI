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
    material?: string;
    careInstructions?: string;
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
      const name = data.productName.trim();
      const brand = data.brand?.trim();
      const category = data.categoryName?.trim();
      return {
        isFallback: true,
        seoTitle: brand ? `${name} — ${brand}` : name,
        description: [
          `Sản phẩm: ${name}.`,
          brand && `Thương hiệu: ${brand}.`,
          category && `Danh mục: ${category}.`,
        ].filter(Boolean).join(' '),
        material: data.material?.trim() ?? '',
        careInstructions: data.careInstructions?.trim() ?? '',
      };
    }
  },
};
