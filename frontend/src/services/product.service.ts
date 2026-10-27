import apiClient from './api-client';
import type { Product, Category, ProductFilter, PagedResult } from '@/types';

export const productService = {
  async getProducts(params?: ProductFilter): Promise<PagedResult<Product>> {
    try {
      const res = await apiClient.get('/products', { params });
      return res.data;
    } catch {
      return { items: [], totalCount: 0, page: 1, pageSize: 0 };
    }
  },

  async getProductById(id: number): Promise<Product> {
    const res = await apiClient.get(`/products/${id}`);
    return res.data;
  },

  async getCategories(): Promise<Category[]> {
    try {
      const res = await apiClient.get('/products/categories');
      return res.data;
    } catch {
      return [];
    }
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    const res = await apiClient.post('/products', data);
    return res.data;
  },

  async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
    const res = await apiClient.put(`/products/${id}`, data);
    return res.data;
  },

  async deleteProduct(id: number): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  },

  async toggleProductStatus(id: number): Promise<{ id: number; isActive: boolean; message: string }> {
    const res = await apiClient.patch(`/products/${id}/toggle-status`);
    return res.data;
  },

  async uploadImage(file: File): Promise<{ url: string; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/products/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async getProductReviews(productId: number): Promise<any[]> {
    try {
      const res = await apiClient.get(`/products/${productId}/reviews`);
      return res.data;
    } catch {
      return [];
    }
  },

  async addProductReview(productId: number, data: { customerName: string; rating: number; comment: string }): Promise<any> {
    const res = await apiClient.post(`/products/${productId}/reviews`, data);
    return res.data;
  },

  async getAiRecommendation(query: string, productId?: number): Promise<string> {
    const res = await apiClient.get('/ai/recommend', { params: { query, productId } });
    return res.data.recommendation;
  },

  async generateAiDescription(data: {
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
    const res = await apiClient.post('/ai/generate-description', data);
    return res.data;
  },
};
