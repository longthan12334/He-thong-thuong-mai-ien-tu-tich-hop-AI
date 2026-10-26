'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Category, Product } from '@/types';
import { productService } from '@/services/product.service';
import { fallbackCategories, fallbackProducts } from '@/lib/mock-data';

/**
 * Danh mục sản phẩm toàn sàn cho phân hệ Khách hàng.
 * Tải 1 lần rồi lưu cache trong bộ nhớ để /shop, trang chi tiết, trang yêu thích
 * dùng chung (lọc/sắp xếp/gợi ý chạy tức thì phía client).
 * Đồng bộ phản ứng tức thì (reactive): khi khách đặt hàng hoặc kho thay đổi,
 * toàn bộ giao diện đang mở tự động cập nhật số lượng tồn kho mới nhất mà KHÔNG cần F5 hay đăng xuất.
 */

const CATALOG_PAGE_SIZE = 10000;

let cachedProducts: Product[] | null = null;
let cachedCategories: Category[] | null = null;
let inflight: Promise<void> | null = null;
let usedFallback = false;

type CatalogListener = (data: { products: Product[]; categories: Category[]; isOffline: boolean }) => void;
const listeners = new Set<CatalogListener>();

function notifySubscribers() {
  const data = {
    products: cachedProducts || [],
    categories: cachedCategories || [],
    isOffline: usedFallback,
  };
  listeners.forEach((listener) => {
    try {
      listener(data);
    } catch {}
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aethelgard:catalog-updated', { detail: data }));
  }
}

export async function reloadCatalog(force = false): Promise<void> {
  if (force) {
    cachedProducts = null;
    cachedCategories = null;
  }
  if (!inflight) {
    inflight = (async () => {
      try {
        const [productRes, categoryRes] = await Promise.allSettled([
          productService.getProducts({ pageSize: CATALOG_PAGE_SIZE }),
          productService.getCategories(),
        ]);
        const items = productRes.status === 'fulfilled' ? productRes.value.items : [];
        usedFallback = items.length === 0;
        cachedProducts = items.length > 0 ? items : fallbackProducts;
        const cats = categoryRes.status === 'fulfilled' ? categoryRes.value : [];
        cachedCategories = cats.length > 0 ? cats : fallbackCategories;
      } catch {
        if (!cachedProducts) cachedProducts = fallbackProducts;
        if (!cachedCategories) cachedCategories = fallbackCategories;
        usedFallback = true;
      }
    })().finally(() => {
      inflight = null;
    });
  }
  await inflight;
  notifySubscribers();
}

/** Tải dữ liệu ban đầu nếu chưa có */
async function loadCatalog() {
  if (cachedProducts && cachedCategories) return;
  await reloadCatalog(false);
}

// Lắng nghe sự kiện toàn cục để reload catalog khi có thay đổi từ SignalR
if (typeof window !== 'undefined') {
  window.addEventListener('aethelgard:request-catalog-reload', () => {
    reloadCatalog(true);
  });
}

export function useCatalog() {
  const [products, setProducts] = useState<Product[]>(cachedProducts || []);
  const [categories, setCategories] = useState<Category[]>(cachedCategories || []);
  const [isLoading, setIsLoading] = useState(!cachedProducts);
  const [isOffline, setIsOffline] = useState(usedFallback);

  useEffect(() => {
    let mounted = true;

    const listener: CatalogListener = (data) => {
      if (!mounted) return;
      setProducts(data.products);
      setCategories(data.categories);
      setIsOffline(data.isOffline);
      setIsLoading(false);
    };

    listeners.add(listener);

    if (!cachedProducts || !cachedCategories) {
      setIsLoading(true);
      loadCatalog().then(() => {
        if (!mounted) return;
        setProducts(cachedProducts || []);
        setCategories(cachedCategories || []);
        setIsOffline(usedFallback);
        setIsLoading(false);
      });
    } else {
      setProducts(cachedProducts);
      setCategories(cachedCategories);
      setIsOffline(usedFallback);
      setIsLoading(false);
    }

    return () => {
      mounted = false;
      listeners.delete(listener);
    };
  }, []);

  const refresh = useCallback(() => reloadCatalog(true), []);

  return { products, categories, isLoading, isOffline, refresh };
}

/** Xóa cache và nạp lại dữ liệu mới nhất ngay lập tức cho tất cả màn hình đang mở */
export async function invalidateCatalog(): Promise<void> {
  await reloadCatalog(true);
}
