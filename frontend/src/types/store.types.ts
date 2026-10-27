/** Định nghĩa kiểu dữ liệu Gian hàng & Thương hiệu chuẩn sàn thương mại điện tử */

export interface StoreBoutique {
  id: number;
  storeCode: string;
  brandId: string;
  storeName: string;
  storeType: string;
  city: string;
  country: string;
  address: string;
  phone: string;
  email: string;
  operatingHours: string;
  latitude: number;
  longitude: number;
  services: string[];
  categories: string[];
  imageUrl?: string;
  storeUrl?: string;
}

export interface StoreBrandProfile {
  sellerId: number;
  brandId: string;
  brandName: string;
  brandCode: string;
  slogan: string;
  rating: number;
  reviewCount: number;
  totalProducts: number;
  totalStock: number;
  boutiqueCount: number;
  avatarUrl: string;
  coverBannerUrl?: string;
  boutiques: StoreBoutique[];
}

export type StoreProfile = StoreBoutique;

export interface UpdateStoreRequest {
  storeName?: string;
  storeType?: string;
  city?: string;
  country?: string;
  address?: string;
  phone?: string;
  email?: string;
  operatingHours?: string;
  imageUrl?: string;
}
