'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Product, Category } from '@/types';
import { productService } from '@/services/product.service';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Plus, Store } from 'lucide-react';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import {
  SellerProductCard,
  SellerDrawer,
  ProductFilters,
  HeroSection,
  BrandCinematicShowcase,
  ProductEditorModal,
  SellerRegisterModal,
} from '@/components/seller';

/** Phân loại sản phẩm để điều phối showroom đa dạng phong cách */
function classifyProductType(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('sunglass') || lower.includes('kính')) return 'sunglasses';
  if (/shoe|giày|loafer|sneaker|boot|bốt|sandal|dép|mule|heel|derby|oxford|clog|slide/i.test(lower)) return 'shoes';
  if (/bag|túi|tote|backpack|clutch|wallet|ví|đồ da/i.test(lower)) return 'bags';
  if (/quần|áo|jacket|t-shirt|shirt|dress|coat|pant|denim|blazer|hoodie|sweater|polo|skirt|vest/i.test(lower)) return 'apparel';
  return 'accessories';
}

/** Sắp xếp xen kẽ (round-robin) các danh mục sản phẩm: Quần áo → Giày dép → Túi ví → Kính mắt → Phụ kiện */
function interleaveShowroomProducts(items: Product[]): Product[] {
  if (!items || items.length <= 1) return items;

  const groups: Record<string, Product[]> = {
    apparel: [],
    shoes: [],
    bags: [],
    sunglasses: [],
    accessories: [],
  };

  for (const item of items) {
    const type = classifyProductType(item.name);
    groups[type].push(item);
  }

  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => b.id - a.id);
  }

  const order = ['apparel', 'shoes', 'bags', 'sunglasses', 'accessories'];
  const maxLen = Math.max(...order.map((k) => groups[k].length), 0);
  const result: Product[] = [];

  for (let i = 0; i < maxLen; i++) {
    for (const key of order) {
      if (i < groups[key].length) {
        result.push(groups[key][i]);
      }
    }
  }

  return result;
}

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [quickFilterType, setQuickFilterType] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<string>('newest');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [displayLimit, setDisplayLimit] = useState<number>(48);

  // Debounce ô tìm kiếm 300ms (Item 46)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Modals
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerProduct, setDrawerProduct] = useState<Product | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const sellerTitle = user?.fullName || user?.email?.split('@')[0]?.toUpperCase() || '';
  const isSellerRole = user?.role === 'Seller' || user?.role === 'Admin';

  // Tải song song Danh mục & Sản phẩm qua Promise.all (Item 60)
  useEffect(() => {
    let isMounted = true;
    const sellerId = user?.userId;
    const isSeller = user?.role === 'Seller' || user?.role === 'Admin';
    const activeSellerId = isSeller && sellerId && sellerId > 0 ? sellerId : undefined;

    setIsLoadingInitial(true);
    Promise.all([
      productService.getCategories(),
      productService.getProducts({
        sellerId: activeSellerId,
        pageSize: activeSellerId ? 1000 : 48,
      }),
    ])
      .then(([cats, res]) => {
        if (!isMounted) return;
        if (cats && cats.length > 0) setCategories(cats);
        if (res && res.items) {
          const processed = interleaveShowroomProducts(res.items);
          setProducts(processed);
          if (processed.length > 0) {
            setDrawerProduct(processed[0]);
          } else {
            setDrawerProduct(null);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoadingInitial(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Bộ lọc sản phẩm sử dụng debouncedSearch
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (categoryFilter) {
      list = list.filter((p) => p.categoryId.toString() === categoryFilter);
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    if (minPrice && !isNaN(Number(minPrice))) {
      list = list.filter((p) => p.basePrice >= Number(minPrice));
    }

    if (maxPrice && !isNaN(Number(maxPrice))) {
      list = list.filter((p) => p.basePrice <= Number(maxPrice));
    }

    if (quickFilterType === 'bestseller') {
      list.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    } else if (quickFilterType === 'discount') {
      list.sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));
    } else if (sortOrder === 'price_asc') {
      list.sort((a, b) => a.basePrice - b.basePrice);
    } else if (sortOrder === 'price_desc') {
      list.sort((a, b) => b.basePrice - a.basePrice);
    } else {
      list = interleaveShowroomProducts(list);
    }

    return list;
  }, [products, categoryFilter, debouncedSearch, minPrice, maxPrice, quickFilterType, sortOrder]);

  // Reset giới hạn hiển thị khi thay đổi bộ lọc tìm kiếm
  useEffect(() => {
    setDisplayLimit(48);
  }, [categoryFilter, debouncedSearch, minPrice, maxPrice, quickFilterType, sortOrder, user]);

  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, displayLimit);
  }, [filteredProducts, displayLimit]);

  const categoriesWithCount = useMemo(() => {
    return categories.map((cat) => ({
      ...cat,
      productCount: products.filter((p) => p.categoryId === cat.id).length,
    }));
  }, [categories, products]);

  // Ổn định các handler bằng useCallback (Item 49)
  const openSellerDrawer = useCallback(
    (p: Product) => {
      if (!isSellerRole) {
        router.push(`/product-detail/${p.id}`);
        return;
      }
      setDrawerProduct(p);
      setIsDrawerOpen(true);
    },
    [isSellerRole, router]
  );

  const closeSellerDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const handleProductUpdated = useCallback((updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setDrawerProduct(updated);
  }, []);

  const handleOpenCreateModal = useCallback(() => {
    setEditingProduct(null);
    setIsEditorOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((p: Product) => {
    setEditingProduct(p);
    setIsEditorOpen(true);
  }, []);

  const handleDeleteProduct = useCallback(
    async (p: Product) => {
      const isConfirmed = await confirm({
        title: 'Xóa Niêm Yết Sản Phẩm',
        message: `Bạn có chắc chắn muốn xóa sản phẩm "${p.name}" (SKU: ${p.sku}) khỏi gian hàng? Hành động này sẽ gỡ bỏ sản phẩm khỏi sàn mua sắm.`,
        confirmText: 'Xóa Vĩnh Viễn',
        cancelText: 'Giữ Lại',
        tone: 'danger',
      });

      if (!isConfirmed) return;

      try {
        await productService.deleteProduct(p.id);
        setProducts((prev) => prev.filter((item) => item.id !== p.id));
        showToast(`Đã xóa sản phẩm "${p.name}" thành công.`);
        if (drawerProduct?.id === p.id) {
          setIsDrawerOpen(false);
        }
      } catch (err: any) {
        showToast(err.response?.data?.message || err.message || 'Không thể xóa sản phẩm.');
      }
    },
    [confirm, drawerProduct, showToast]
  );

  const handleProductSaved = useCallback(
    (savedProduct: Product, isEdit: boolean) => {
      if (isEdit) {
        setProducts((prev) => prev.map((p) => (p.id === savedProduct.id ? savedProduct : p)));
        showToast(`Đã cập nhật sản phẩm "${savedProduct.name}" thành công!`);
      } else {
        setProducts((prev) => [savedProduct, ...prev]);
        showToast(`Đã thêm mới và niêm yết sản phẩm "${savedProduct.name}" lên sàn!`);
      }
      setDrawerProduct(savedProduct);
    },
    [showToast]
  );

  const resetFilters = useCallback(() => {
    setCategoryFilter('');
    setQuickFilterType('');
    setMinPrice('');
    setMaxPrice('');
    setSortOrder('newest');
    setSearchTerm('');
  }, []);

  const scrollToCatalog = useCallback(() => {
    const el = document.getElementById('catalog');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleExploreProduct = useCallback(
    (keyword: string) => {
      const matched = products.find((p) => p.name.toLowerCase().includes(keyword.toLowerCase()));
      if (matched) {
        openSellerDrawer(matched);
      } else {
        scrollToCatalog();
      }
    },
    [products, openSellerDrawer, scrollToCatalog]
  );

  return (
    <>
      {/* 1. BANNER CHÍNH */}
      <HeroSection
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        onScrollToCatalog={scrollToCatalog}
        products={products}
      />

      {/* 2. BRAND CINEMATIC SHOWCASE (SÂN KHẤU ẢNH CHÍNH) */}
      <BrandCinematicShowcase
        shopName={sellerTitle || 'Aethelgard Store'}
        products={products}
        onExploreProduct={handleExploreProduct}
        onScrollToCatalog={scrollToCatalog}
      />

      {/* 3. SHOWROOM SẢN PHẨM CỬA HÀNG */}
      <section className="page-section shop-section" id="catalog">
        <main className="main-layout">
          {/* Lưới sản phẩm */}
          <section className="catalog-section">
            <div className="catalog-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
              <div>
                <h2 id="catalog-title" className="text-xl sm:text-2xl font-bold text-slate-900">
                  {sellerTitle
                    ? `Gian Trưng Bày — ${sellerTitle}`
                    : 'Sản Phẩm Đang Niêm Yết Trên Sàn'}
                </h2>
              </div>

              {/* ACTION BUTTONS: THÊM SẢN PHẨM MỚI / MỞ GIAN HÀNG */}
              <div className="flex items-center gap-2">
                {!isSellerRole && (
                  <button
                    type="button"
                    onClick={() => setIsRegisterOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-sky-200 bg-sky-50 text-sky-700 text-xs font-bold hover:bg-sky-100 transition-colors shadow-sm cursor-pointer"
                  >
                    <Store className="w-4 h-4" />
                    <span>Mở Gian Hàng Seller</span>
                  </button>
                )}

                {isSellerRole && (
                  <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-md shadow-sky-200 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm Sản Phẩm Mới</span>
                  </button>
                )}
              </div>
            </div>

            {/* THANH DANH MỤC */}
            <ProductFilters
              categories={categoriesWithCount}
              totalProductsCount={products.length}
              categoryFilter={categoryFilter}
              onCategoryChange={setCategoryFilter}
              quickFilterType={quickFilterType}
              onQuickFilterChange={setQuickFilterType}
              minPrice={minPrice}
              onMinPriceChange={setMinPrice}
              maxPrice={maxPrice}
              onMaxPriceChange={setMaxPrice}
              sortOrder={sortOrder}
              onSortOrderChange={setSortOrder}
              onReset={resetFilters}
              filteredCount={filteredProducts.length}
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
            />

            {/* LƯỚI SẢN PHẨM HOẶC SKELETON KHI LOADING (Item 10) */}
            <div id="product-grid" className="product-grid">
              {isLoadingInitial
                ? Array.from({ length: 8 }).map((_, idx) => (
                    <ProductCardSkeleton key={`skeleton-${idx}`} />
                  ))
                : visibleProducts.map((p) => (
                    <SellerProductCard
                      key={p.id}
                      product={p}
                      onClick={openSellerDrawer}
                    />
                  ))}
            </div>

            {!isLoadingInitial && displayLimit < filteredProducts.length && (
              <div className="flex justify-center mt-10 mb-6">
                <button
                  type="button"
                  onClick={() => setDisplayLimit((prev) => prev + 48)}
                  className="px-7 py-3 rounded-full bg-white border border-slate-200 text-slate-800 text-sm font-bold shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Xem thêm sản phẩm</span>
                  <span className="text-xs text-slate-400 font-semibold">
                    {`(Đang xem ${visibleProducts.length} / ${filteredProducts.length})`}
                  </span>
                </button>
              </div>
            )}
          </section>
        </main>
      </section>

      {/* 5. SELLER DRAWER */}
      <SellerDrawer
        isOpen={isDrawerOpen}
        product={drawerProduct}
        onClose={closeSellerDrawer}
        onShowToast={showToast}
        onEditProduct={handleOpenEditModal}
        onDeleteProduct={handleDeleteProduct}
        onProductUpdated={handleProductUpdated}
      />

      {/* 6. MODAL THÊM / SỬA SẢN PHẨM ĐA BƯỚC */}
      <ProductEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSuccess={handleProductSaved}
        initialProduct={editingProduct}
        categories={categories}
      />

      {/* 7. MODAL ĐĂNG KÝ GIAN HÀNG SELLER */}
      <SellerRegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        user={user}
        onSuccess={() => {
          showToast('Chúc mừng bạn đã trở thành Người Bán chính thức!');
        }}
      />

      {/* 8. DIALOG XÁC NHẬN AN TOÀN */}
      {confirmDialog}
    </>
  );
}
