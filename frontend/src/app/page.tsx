'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { fallbackProducts } from '@/lib/mock-data';
import type { Product } from '@/types';
import { productService } from '@/services/product.service';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useCart } from '@/hooks/useCart';

import {
  SellerProductCard,
  SellerDrawer,
  ProductFilters,
  HeroSection,
  RecommendationsSection,
  CartModal,
  CheckoutModal,
  type CartItem,
} from '@/components/seller';

export default function HomePage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [quickFilterType, setQuickFilterType] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<string>('newest');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  // Global Cart & Modals
  const {
    cart,
    totalQty: totalCartQty,
    totalAmount: totalCartAmount,
    removeFromCart,
    clearCart,
    isCartOpen,
    setIsCartOpen,
    isCheckoutOpen,
    setIsCheckoutOpen,
  } = useCart();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerProduct, setDrawerProduct] = useState<Product | null>(fallbackProducts[0] || null);


  const sellerTitle = user?.fullName || user?.email?.split('@')[0]?.toUpperCase() || '';

  // Tải danh sách sản phẩm từ backend API qua productService
  useEffect(() => {
    let isMounted = true;
    const sellerId = user?.userId;

    productService
      .getProducts({
        sellerId: sellerId && sellerId > 0 ? sellerId : undefined,
        pageSize: 200,
      })
      .then((res) => {
        if (isMounted && res && res.items && res.items.length > 0) {
          setProducts(res.items);
          if (!drawerProduct) {
            setDrawerProduct(res.items[0]);
          }
        }
      })
      .catch(() => {
        // Fallback tự động trong productService
      });

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
      list.sort((a, b) => b.reviewCount - a.reviewCount);
    } else if (quickFilterType === 'discount') {
      list.sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));
    } else if (sortOrder === 'price_asc') {
      list.sort((a, b) => a.basePrice - b.basePrice);
    } else if (sortOrder === 'price_desc') {
      list.sort((a, b) => b.basePrice - a.basePrice);
    } else {
      list.sort((a, b) => b.id - a.id);
    }

    return list;
  }, [products, categoryFilter, searchTerm, minPrice, maxPrice, quickFilterType, sortOrder]);

  // Reset về trang 1 khi thay đổi bộ lọc hoặc tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, searchTerm, minPrice, maxPrice, quickFilterType, sortOrder]);

  // Phân trang
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      scrollToCatalog();
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const openSellerDrawer = (p: Product) => {
    setDrawerProduct(p);
    setIsDrawerOpen(true);
  };

  const closeSellerDrawer = () => {
    setIsDrawerOpen(false);
  };

  const resetFilters = () => {
    setCategoryFilter('');
    setQuickFilterType('');
    setMinPrice('');
    setMaxPrice('');
    setSortOrder('newest');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const scrollToCatalog = () => {
    const el = document.getElementById('catalog');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      {/* 1. HERO BANNER */}
      <HeroSection
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        onScrollToCatalog={scrollToCatalog}
      />

      {/* 2. CATALOG & SIDEBAR FILTERS */}
      <section className="page-section shop-section" id="catalog">
        <main className="main-layout">
          <ProductFilters
            categories={[]}
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
          />

          {/* Product Grid */}
          <section className="catalog-section">
            <div className="catalog-header">
              <div>
                <h2 id="catalog-title">
                  {sellerTitle
                    ? `Bộ Sưu Tập Chính Hãng — ${sellerTitle}`
                    : 'Danh Sách Sản Phẩm Aethelgard Mall'}
                </h2>
                <span id="results-count" className="results-tag">
                  Hiển thị {filteredProducts.length} sản phẩm (Trang {currentPage}/{totalPages})
                </span>
              </div>
            </div>

            <div id="product-grid" className="product-grid">
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((p) => (
                  <SellerProductCard
                    key={p.id}
                    product={p}
                    onClick={openSellerDrawer}
                  />
                ))
              ) : (
                <div className="col-span-full py-16 text-center text-slate-500">
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-bar">
                <button
                  className="pagination-btn pagination-prev"
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  style={{
                    opacity: currentPage <= 1 ? 0.35 : 1,
                    cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  &larr; Previous
                </button>

                <div className="pagination-numbers">
                  {getPageNumbers().map((pageItem, idx) => {
                    if (pageItem === '...') {
                      return (
                        <span key={`dots-${idx}`} className="page-dots">
                          ...
                        </span>
                      );
                    }
                    const pageNum = Number(pageItem);
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`page-num ${isActive ? 'active' : ''}`}
                        aria-label={`Trang ${pageNum}`}
                        style={{ border: 'none', outline: 'none' }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  className="pagination-btn pagination-next"
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  style={{
                    opacity: currentPage >= totalPages ? 0.35 : 1,
                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  }}
                >
                  Next &rarr;
                </button>
              </div>
            )}
          </section>
        </main>
      </section>

      {/* 3. RECOMMENDATIONS CAROUSEL */}
      <RecommendationsSection
        products={products}
        onOpenDrawer={openSellerDrawer}
        onShowToast={showToast}
      />

      {/* 4. NEWSLETTER BANNER */}
      <section className="page-section newsletter-section">
        <div className="newsletter-card">
          <div className="newsletter-content">
            <h2 className="newsletter-heading">Ready to Get Our New Stuff?</h2>
            <form
              className="newsletter-form"
              onSubmit={(e) => {
                e.preventDefault();
                showToast('Cảm ơn bạn đã đăng ký nhận bản tin!');
              }}
            >
              <input
                type="email"
                required
                placeholder="Your Email"
                aria-label="Email subscription"
                className="newsletter-input"
              />
              <button type="submit" className="btn-newsletter-send">
                Send
              </button>
            </form>
          </div>
          <div className="newsletter-subtext">
            <p className="brand-subtext-bold">SE.Bus for Homes and Needs</p>
            <p>
              We&apos;ll listen to your needs, identify the best approach, and then create a bespoke
              smart EV charging solution that&apos;s right for you.
            </p>
          </div>
        </div>
      </section>

      {/* 5. MODALS & SLIDING DRAWER */}
      <CartModal
        isOpen={isCartOpen}
        cart={cart}
        totalQty={totalCartQty}
        totalAmount={totalCartAmount}
        onClose={() => setIsCartOpen(false)}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        onProceedCheckout={() => {
          if (cart.length === 0) {
            showToast('Giỏ hàng trống!');
            return;
          }
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        cart={cart}
        totalAmount={totalCartAmount}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={(orderCode) => {
          showToast(`Đặt hàng thành công! Mã đơn hàng của bạn: ${orderCode}`);
          clearCart();
          setIsCheckoutOpen(false);
        }}
        onError={(err) => {
          showToast(err);
        }}
      />

      <SellerDrawer
        isOpen={isDrawerOpen}
        product={drawerProduct}
        onClose={closeSellerDrawer}
        onShowToast={showToast}
      />
    </>
  );
}
