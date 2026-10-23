'use client';

/**
 * ShopperContext — Trạng thái cá nhân hóa của Khách hàng (Customer module)
 * - Danh sách yêu thích (Wishlist), lưu localStorage để giữ sau khi tải lại trang
 * - Lịch sử sản phẩm đã xem gần đây: dữ liệu đầu vào cho bộ gợi ý cá nhân hóa
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Product } from '@/types';

const WISHLIST_KEY = 'aethelgard_wishlist';
const RECENT_KEY = 'aethelgard_recently_viewed';
const MAX_RECENT = 12;

/** Ảnh chụp gọn của sản phẩm để lưu localStorage (không lưu variants/gallery cho nhẹ) */
export type ProductSnapshot = Pick<
  Product,
  | 'id'
  | 'name'
  | 'slug'
  | 'sku'
  | 'categoryId'
  | 'categoryName'
  | 'collectionName'
  | 'basePrice'
  | 'originalPrice'
  | 'discountPercent'
  | 'imageUrl'
  | 'stockQuantity'
  | 'stockStatus'
  | 'rating'
  | 'reviewCount'
  | 'description'
>;

export const toSnapshot = (p: Product | ProductSnapshot): ProductSnapshot => ({
  id: p.id,
  name: p.name,
  slug: p.slug,
  sku: p.sku,
  categoryId: p.categoryId,
  categoryName: p.categoryName,
  collectionName: p.collectionName,
  basePrice: p.basePrice,
  originalPrice: p.originalPrice,
  discountPercent: p.discountPercent,
  imageUrl: p.imageUrl,
  stockQuantity: p.stockQuantity,
  stockStatus: p.stockStatus,
  rating: p.rating,
  reviewCount: p.reviewCount,
  description: (p.description || '').slice(0, 240),
});

interface ShopperContextType {
  wishlist: ProductSnapshot[];
  isInWishlist: (productId: number) => boolean;
  toggleWishlist: (product: Product | ProductSnapshot) => boolean;
  removeFromWishlist: (productId: number) => void;
  recentlyViewed: ProductSnapshot[];
  trackView: (product: Product | ProductSnapshot) => void;
}

const ShopperContext = createContext<ShopperContextType | null>(null);

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Bỏ qua lỗi quota / chế độ ẩn danh
  }
}

export const ShopperProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<ProductSnapshot[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<ProductSnapshot[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setWishlist(readStorage<ProductSnapshot[]>(WISHLIST_KEY, []));
    setRecentlyViewed(readStorage<ProductSnapshot[]>(RECENT_KEY, []));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) writeStorage(WISHLIST_KEY, wishlist);
  }, [wishlist, isLoaded]);

  useEffect(() => {
    if (isLoaded) writeStorage(RECENT_KEY, recentlyViewed);
  }, [recentlyViewed, isLoaded]);

  const isInWishlist = useCallback(
    (productId: number) => wishlist.some((p) => p.id === productId),
    [wishlist]
  );

  /** Trả về true nếu sản phẩm vừa được THÊM, false nếu vừa bị GỠ */
  const toggleWishlist = useCallback(
    (product: Product | ProductSnapshot) => {
      const exists = wishlist.some((p) => p.id === product.id);
      setWishlist((prev) =>
        exists ? prev.filter((p) => p.id !== product.id) : [toSnapshot(product), ...prev]
      );
      return !exists;
    },
    [wishlist]
  );

  const removeFromWishlist = useCallback((productId: number) => {
    setWishlist((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  const trackView = useCallback((product: Product | ProductSnapshot) => {
    if (!product || !product.id) return;
    setRecentlyViewed((prev) =>
      [toSnapshot(product), ...prev.filter((p) => p.id !== product.id)].slice(0, MAX_RECENT)
    );
  }, []);

  const value = useMemo(
    () => ({ wishlist, isInWishlist, toggleWishlist, removeFromWishlist, recentlyViewed, trackView }),
    [wishlist, isInWishlist, toggleWishlist, removeFromWishlist, recentlyViewed, trackView]
  );

  return <ShopperContext.Provider value={value}>{children}</ShopperContext.Provider>;
};

export const useShopper = (): ShopperContextType => {
  const ctx = useContext(ShopperContext);
  if (!ctx) {
    throw new Error('useShopper phải được sử dụng bên trong <ShopperProvider>');
  }
  return ctx;
};
