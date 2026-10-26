'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fallbackProducts, fallbackCategories } from '@/lib/mock-data';
import type { Product, Category } from '@/types';
import { productService } from '@/services/product.service';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Plus, Store, Sparkles } from 'lucide-react';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
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

  // Giữ các sản phẩm mới nhất lên đầu trong từng nhóm
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
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [quickFilterType, setQuickFilterType] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<string>('newest');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [displayLimit, setDisplayLimit] = useState<number>(48);

  // Modals
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerProduct, setDrawerProduct] = useState<Product | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Khách hàng mua sắm: chuyển hướng tự động sang khu mua sắm /shop
  useEffect(() => {
    if (user?.role === 'Customer') {
      router.replace('/shop');
    }
  }, [user, router]);

  const isSellerRole = user?.role === 'Seller';
  const isAdminRole = user?.role === 'Admin';
  const isManagement = isSellerRole || isAdminRole;
  const sellerTitle = isSellerRole ? (user?.fullName || user?.email?.split('@')[0]?.toUpperCase() || '') : '';

  // Tải danh mục thực tế từ backend API
  useEffect(() => {
    productService
      .getCategories()
      .then((cats) => {
        if (cats && cats.length > 0) setCategories(cats);
      })
      .catch(() => {});
  }, []);

  // Tải danh sách sản phẩm từ backend API qua productService
  useEffect(() => {
    let isMounted = true;
    const sellerId = user?.userId;

    const activeSellerId = isSellerRole && sellerId && sellerId > 0 ? sellerId : undefined;

    productService
      .getProducts({
        sellerId: activeSellerId,
        // Khi Seller đăng nhập quản lý gian hàng: tải toàn bộ kho hàng của shop (tối đa 1000)
        // Khi Admin hoặc xem toàn sàn: tải toàn bộ danh mục để số lượng khớp hoàn toàn với CSDL (10000)
        pageSize: activeSellerId ? 1000 : 10000,
      })
      .then((res) => {
        if (isMounted && res && res.items) {
          const processed = interleaveShowroomProducts(res.items);
          setProducts(processed);
          if (processed.length > 0) {
            setDrawerProduct(processed[0]);
          } else {
            setDrawerProduct(null);
          }
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Bộ lọc sản phẩm
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (categoryFilter) {
      list = list.filter((p) => p.categoryId.toString() === categoryFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
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
  }, [products, categoryFilter, searchTerm, minPrice, maxPrice, quickFilterType, sortOrder]);

  // Reset giới hạn hiển thị khi thay đổi bộ lọc tìm kiếm
  useEffect(() => {
    setDisplayLimit(48);
  }, [categoryFilter, searchTerm, minPrice, maxPrice, quickFilterType, sortOrder, user]);

  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, displayLimit);
  }, [filteredProducts, displayLimit]);

  const activeSellerId = isSellerRole && user?.userId && user?.userId > 0 ? user.userId : undefined;

  const categoriesWithCount = useMemo(() => {
    return categories.map((cat) => ({
      ...cat,
      productCount: activeSellerId
        ? products.filter((p) => p.categoryId === cat.id).length
        : (cat.productCount || products.filter((p) => p.categoryId === cat.id).length),
    }));
  }, [categories, products, activeSellerId]);

  const totalCatalogCount = useMemo(() => {
    if (activeSellerId) return products.length;
    return categories.reduce((sum, c) => sum + (c.productCount || 0), 0) || products.length;
  }, [categories, products, activeSellerId]);

  const openSellerDrawer = (p: Product) => {
    // Nếu là khách hàng hoặc khách vãng lai: chuyển đến trang chi tiết sản phẩm khách hàng
    if (!isManagement) {
      router.push(`/product-detail/${p.id}`);
      return;
    }
    setDrawerProduct(p);
    setIsDrawerOpen(true);
  };

  const closeSellerDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setIsEditorOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setIsEditorOpen(true);
  };

  const handleDeleteProduct = async (p: Product) => {
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
  };

  const handleProductSaved = (savedProduct: Product, isEdit: boolean) => {
    if (isEdit) {
      setProducts((prev) => prev.map((p) => (p.id === savedProduct.id ? savedProduct : p)));
      showToast(`Đã cập nhật sản phẩm "${savedProduct.name}" thành công!`);
    } else {
      setProducts((prev) => [savedProduct, ...prev]);
      showToast(`Đã thêm mới và niêm yết sản phẩm "${savedProduct.name}" lên sàn!`);
    }
    setDrawerProduct(savedProduct);
  };

  const resetFilters = () => {
    setCategoryFilter('');
    setQuickFilterType('');
    setMinPrice('');
    setMaxPrice('');
    setSortOrder('newest');
    setSearchTerm('');
  };

  const scrollToCatalog = () => {
    const el = document.getElementById('catalog');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleExploreProduct = (keyword: string) => {
    const matched = products.find((p) => p.name.toLowerCase().includes(keyword.toLowerCase()));
    if (matched) {
      openSellerDrawer(matched);
    } else {
      scrollToCatalog();
    }
  };

  return (
    <>
      {/* 1. BANNER CHÍNH */}
      <HeroSection
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        onScrollToCatalog={scrollToCatalog}
        products={products}
      />

      {/* 2. BRAND CINEMATIC SHOWCASE (SÂN KHẤU ẢNH CHÍNH ĐỔI 10S/LẦN) */}
      <BrandCinematicShowcase
        shopName={isSellerRole ? (sellerTitle || 'Gian Hàng') : 'Aethelgard Luxury Mall'}
        products={products}
        onExploreProduct={handleExploreProduct}
        onScrollToCatalog={scrollToCatalog}
      />

      {/* 3. SHOWROOM SẢN PHẨM CỬA HÀNG */}
      <section className="page-section shop-section" id="catalog">
        <main className="main-layout">
          <ProductFilters
            categories={categoriesWithCount}
            totalProductsCount={totalCatalogCount}
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
          />

          {/* Lưới sản phẩm */}
          <section className="catalog-section">
            <div className="catalog-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
              <div>
                <h2 id="catalog-title" className="text-xl sm:text-2xl font-bold text-slate-900">
                  {isSellerRole && sellerTitle
                    ? `Gian Trưng Bày — ${sellerTitle}`
                    : (isAdminRole ? 'Quản Trị Sản Phẩm Toàn Sàn' : 'Sản Phẩm Đang Niêm Yết Trên Sàn')}
                </h2>
                <span id="results-count" className="results-tag text-xs text-slate-500 font-medium">
                  Hiển thị {filteredProducts.length} sản phẩm thực tế
                </span>
              </div>

              {/* ACTION BUTTONS: THÊM SẢN PHẨM MỚI / MỞ GIAN HÀNG */}
              <div className="flex items-center gap-2">
                {!isSellerRole && (
                  <button
                    type="button"
                    onClick={() => setIsRegisterOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors shadow-sm cursor-pointer"
                  >
                    <Store className="w-4 h-4" />
                    <span>Mở Gian Hàng Seller</span>
                  </button>
                )}

                {isSellerRole && (
                  <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm Sản Phẩm Mới</span>
                  </button>
                )}
              </div>
            </div>

            <div id="product-grid" className="product-grid">
              {visibleProducts.map((p) => (
                <SellerProductCard
                  key={p.id}
                  product={p}
                  onClick={openSellerDrawer}
                  isSeller={isSellerRole}
                />
              ))}
            </div>

            {displayLimit < filteredProducts.length && (
              <div className="flex justify-center mt-10 mb-6">
                <button
                  type="button"
                  onClick={() => setDisplayLimit((prev) => prev + 48)}
                  className="px-7 py-3 rounded-full bg-white border border-slate-200 text-slate-800 text-sm font-bold shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Xem thêm sản phẩm</span>
                  <span className="text-xs text-slate-400 font-semibold">
                    (Đang xem {visibleProducts.length} / {filteredProducts.length})
                  </span>
                </button>
              </div>
            )}
          </section>
        </main>
      </section>

      {/* 5. SELLER DRAWER — Chỉnh sửa & Xóa sản phẩm */}
      <SellerDrawer
        isOpen={isDrawerOpen}
        product={drawerProduct}
        onClose={closeSellerDrawer}
        onShowToast={showToast}
        onEditProduct={handleOpenEditModal}
        onDeleteProduct={handleDeleteProduct}
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
