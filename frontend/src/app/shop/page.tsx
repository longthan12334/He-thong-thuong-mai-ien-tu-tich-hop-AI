'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { HeroSection } from '@/components/seller/HeroSection';
import {
  CustomerProductCard,
  CustomerFilters,
  CustomerPagination,
  ShopSubnav,
  DEFAULT_CUSTOMER_FILTERS,
  type CustomerFilterState,
} from '@/components/customer';
import { ProductCardSkeleton } from '@/components/ui';
import { useCatalog } from '@/hooks/useCatalog';
import { useAuth } from '@/hooks/useAuth';
import { useShopper } from '@/contexts/ShopperContext';
import { extractBrand, recommendProducts } from '@/lib/customer';

const ITEMS_PER_PAGE = 12;

/** Bỏ dấu tiếng Việt để tìm kiếm "giay" vẫn ra "Giày" */
const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');

function ShopPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { products, categories, isLoading, isOffline } = useCatalog();
  const { recentlyViewed, wishlist } = useShopper();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState<CustomerFilterState>({
    ...DEFAULT_CUSTOMER_FILTERS,
    categoryId: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Đồng bộ tìm kiếm / danh mục / thương hiệu lên URL để chia sẻ link & giữ trạng thái khi quay lại
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set('q', searchTerm.trim());
      if (filters.categoryId) params.set('category', filters.categoryId);
      if (filters.brand) params.set('brand', filters.brand);
      const qs = params.toString();
      router.replace(qs ? `/shop?${qs}` : '/shop', { scroll: false });
    }, 350);
    return () => clearTimeout(t);
  }, [searchTerm, filters.categoryId, filters.brand, router]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  const brands = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const b = extractBrand(p);
      if (b) map.set(b, (map.get(b) || 0) + 1);
    });
    return Array.from(map, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [products]);

  const categoriesWithCount = useMemo(
    () =>
      categories
        .map((c) => ({ ...c, visibleCount: products.filter((p) => p.categoryId === c.id).length }))
        .filter((c) => c.visibleCount > 0),
    [categories, products]
  );

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (filters.categoryId) list = list.filter((p) => String(p.categoryId) === filters.categoryId);
    if (filters.brand) list = list.filter((p) => extractBrand(p) === filters.brand);
    if (filters.inStockOnly) list = list.filter((p) => (p.stockQuantity ?? 0) > 0);

    if (searchTerm.trim()) {
      const terms = fold(searchTerm.trim()).split(/\s+/);
      list = list.filter((p) => {
        const text = fold(`${p.name} ${p.sku} ${p.collectionName || ''} ${p.categoryName || ''} ${p.description || ''}`);
        return terms.every((t) => text.includes(t));
      });
    }

    const min = Number(filters.minPrice);
    const max = Number(filters.maxPrice);
    if (filters.minPrice && !isNaN(min)) list = list.filter((p) => p.basePrice >= min);
    if (filters.maxPrice && !isNaN(max)) list = list.filter((p) => p.basePrice <= max);

    if (filters.quick === 'discount') list = list.filter((p) => (p.discountPercent || 0) > 0);

    const sortKey =
      filters.quick === 'bestseller' ? 'popular'
      : filters.quick === 'top_rated' ? 'rating'
      : filters.quick === 'newest' ? 'newest'
      : filters.sort;

    list.sort((a, b) => {
      switch (sortKey) {
        case 'price_asc':
          return a.basePrice - b.basePrice;
        case 'price_desc':
          return b.basePrice - a.basePrice;
        case 'popular':
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0) || (b.reviewCount || 0) - (a.reviewCount || 0);
        default:
          return filters.quick === 'discount'
            ? (b.discountPercent || 0) - (a.discountPercent || 0)
            : b.id - a.id;
      }
    });
    return list;
  }, [products, filters, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginated = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const hasSignals = recentlyViewed.length > 0 || wishlist.length > 0;
  const recommendations = useMemo(
    () => recommendProducts(products, { viewed: recentlyViewed, wishlist }, 4),
    [products, recentlyViewed, wishlist]
  );

  const scrollToCatalog = () => {
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const resetFilters = () => {
    setFilters(DEFAULT_CUSTOMER_FILTERS);
    setSearchTerm('');
  };

  const activeCategory = categories.find((c) => String(c.id) === filters.categoryId);
  const greeting = user?.fullName ? `Xin chào ${user.fullName}` : 'Sàn Thời Trang Cao Cấp';

  return (
    <>
      <HeroSection
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        onScrollToCatalog={scrollToCatalog}
        products={products}
      />

      <section className="page-section shop-section" id="catalog">
        <div className="customer-shop-topbar">
          <ShopSubnav />
          {isOffline && !isLoading && (
            <span className="customer-offline-pill">Đang hiển thị dữ liệu mẫu — chưa kết nối được máy chủ</span>
          )}
        </div>

        <main className="main-layout">
          <CustomerFilters
            categories={categoriesWithCount}
            brands={brands}
            totalProductsCount={products.length}
            value={filters}
            onChange={(next) => setFilters((prev) => ({ ...prev, ...next }))}
            onReset={resetFilters}
          />

          <section className="catalog-section">
            <div className="catalog-header">
              <div>
                <h2 id="catalog-title">
                  {activeCategory ? activeCategory.name : filters.brand ? `Thương hiệu ${filters.brand}` : greeting}
                </h2>
                <span className="results-tag">
                  {isLoading
                    ? 'Đang tải sản phẩm...'
                    : `Hiển thị ${filteredProducts.length} sản phẩm${totalPages > 1 ? ` (Trang ${currentPage}/${totalPages})` : ''}`}
                  {searchTerm.trim() && ` cho “${searchTerm.trim()}”`}
                </span>
              </div>
            </div>

            <div className="product-grid">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
              ) : paginated.length > 0 ? (
                paginated.map((p) => <CustomerProductCard key={p.id} product={p} />)
              ) : (
                <div className="col-span-full py-16 text-center text-slate-500 customer-empty-grid">
                  <p className="text-base font-semibold">Không tìm thấy sản phẩm phù hợp với bộ lọc.</p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-3 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-200 transition-all cursor-pointer"
                  >
                    Xóa tất cả bộ lọc
                  </button>
                </div>
              )}
            </div>

            <CustomerPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => {
                setCurrentPage(p);
                scrollToCatalog();
              }}
            />
          </section>
        </main>
      </section>

      {/* GỢI Ý CÁ NHÂN HÓA (AI Recommendation) */}
      {!isLoading && recommendations.length > 0 && (
        <section className="page-section recommendations-section">
          <div className="section-container">
            <div className="section-header">
              <div>
                <h2>{hasSignals ? 'Gợi Ý Dành Riêng Cho Bạn' : 'Được Yêu Thích Nhất Trên Sàn'}</h2>
                <p className="customer-section-sub">
                  {hasSignals
                    ? 'AI phân tích sản phẩm bạn đã xem & yêu thích để chọn ra những món phù hợp nhất'
                    : 'Xem hoặc thả tim vài sản phẩm để nhận gợi ý cá nhân hóa'}
                </p>
              </div>
            </div>
            <div className="recommendations-grid">
              {recommendations.map(({ product, reason }) => (
                <CustomerProductCard key={product.id} product={product} reason={hasSignals ? reason : undefined} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ĐÃ XEM GẦN ĐÂY */}
      {recentlyViewed.length > 0 && (
        <section className="page-section recommendations-section customer-recent-section">
          <div className="section-container">
            <div className="section-header">
              <h2>Sản Phẩm Bạn Đã Xem</h2>
            </div>
            <div className="customer-recent-strip">
              {recentlyViewed.slice(0, 8).map((p) => (
                <CustomerProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={null}>
      <ShopPageContent />
    </Suspense>
  );
}
