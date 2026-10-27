'use client';

import { useEffect, useState } from 'react';
import type { Category, Product } from '@/types';
import { productService } from '@/services/product.service';

/**
 * Danh mục sản phẩm toàn sàn cho phân hệ Khách hàng.
 * Tải 1 lần rồi lưu cache trong bộ nhớ để /shop, trang chi tiết, trang yêu thích
 * dùng chung (lọc/sắp xếp/gợi ý chạy tức thì phía client).
 * Không lọc theo sellerId: khách xem sản phẩm của TẤT CẢ gian hàng.
 */

const CATALOG_PAGE_SIZE = 300;

let cachedProducts: Product[] | null = null;
let cachedCategories: Category[] | null = null;
let inflight: Promise<void> | null = null;
let usedFallback = false;

async function loadCatalog() {
  if (cachedProducts && cachedCategories) return;
  if (!inflight) {
    inflight = (async () => {
      const [productRes, categoryRes] = await Promise.allSettled([
        productService.getProducts({ pageSize: CATALOG_PAGE_SIZE }),
        productService.getCategories(),
      ]);
      const items = productRes.status === 'fulfilled' ? productRes.value.items : [];
      usedFallback = false;
      cachedProducts = items;
      const cats = categoryRes.status === 'fulfilled' ? categoryRes.value : [];
      cachedCategories = cats;
    })().finally(() => {
      inflight = null;
    });
  }
  await inflight;
}

export function useCatalog() {
  const [products, setProducts] = useState<Product[]>(cachedProducts || []);
  const [categories, setCategories] = useState<Category[]>(cachedCategories || []);
  const [isLoading, setIsLoading] = useState(!cachedProducts);

  useEffect(() => {
    let mounted = true;
    loadCatalog().then(() => {
      if (!mounted) return;
      setProducts(cachedProducts || []);
      setCategories(cachedCategories || []);
      setIsLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return { products, categories, isLoading, isOffline: usedFallback };
}

/** Xóa cache (ví dụ sau khi đặt hàng để tồn kho hiển thị chính xác lần tải sau) */
export function invalidateCatalog() {
  cachedProducts = null;
  cachedCategories = null;
}
