'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X, ArrowRight, Sparkles, Tag, Package, ExternalLink } from 'lucide-react';
import type { Product, Category } from '@/types';
import { useCatalog } from '@/hooks/useCatalog';
import { extractBrand } from '@/lib/customer';
import { formatVND } from '@/lib/utils';

interface HeroSectionProps {
  searchTerm: string;
  onSearchTermChange: (val: string) => void;
  onScrollToCatalog: () => void;
  products?: Product[];
}

/** Chuẩn hóa xâu tiếng Việt không dấu để tìm kiếm thông minh */
const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');

const POPULAR_TAGS = ['Dior', 'Gucci', 'Adidas', 'Nike', 'Áo khoác', 'Sneaker', 'Túi xách'];

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchTerm,
  onSearchTermChange,
  onScrollToCatalog,
  products: propProducts,
}) => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { products: catalogProducts, categories: catalogCategories } = useCatalog();
  const allProducts = useMemo(() => {
    return propProducts && propProducts.length > 0 ? propProducts : catalogProducts;
  }, [propProducts, catalogProducts]);

  const [isOpen, setIsOpen] = useState(false);
  const [isBgLoaded, setIsBgLoaded] = useState(false);

  // Preload ảnh nền Hero để kích hoạt hiệu ứng Cross-fade mềm mại (Item 16)
  useEffect(() => {
    const img = new Image();
    img.src = '/img/products/fashion-mood-board.jpg';
    img.onload = () => setIsBgLoaded(true);
  }, []);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Lọc sản phẩm khớp từ khóa theo thời gian thực (Live instant search)
  const { matchingProducts, matchedBrands, matchedCategories, totalMatchesCount } = useMemo(() => {
    const q = searchTerm.trim();
    if (!q) {
      return { matchingProducts: [], matchedBrands: [], matchedCategories: [], totalMatchesCount: 0 };
    }

    const terms = fold(q).split(/\s+/).filter(Boolean);

    // 1. Lọc sản phẩm
    const matches = allProducts.filter((p) => {
      const brand = extractBrand(p) || '';
      const combined = fold(`${p.name} ${p.sku || ''} ${p.categoryName || ''} ${p.collectionName || ''} ${brand}`);
      return terms.every((term) => combined.includes(term));
    });

    // 2. Lọc thương hiệu nổi bật khớp từ khóa
    const brandSet = new Set<string>();
    allProducts.forEach((p) => {
      const b = extractBrand(p);
      if (b && fold(b).includes(fold(q))) brandSet.add(b);
    });

    // 3. Lọc danh mục khớp từ khóa
    const cats = catalogCategories.filter((c) => fold(c.name).includes(fold(q))).slice(0, 2);

    return {
      matchingProducts: matches.slice(0, 5), // Giới hạn 5 kết quả đầu cho menu gọn gàng
      matchedBrands: Array.from(brandSet).slice(0, 3),
      matchedCategories: cats,
      totalMatchesCount: matches.length,
    };
  }, [searchTerm, allProducts, catalogCategories]);

  // Tự động mở gợi ý khi có từ khóa
  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      setIsOpen(true);
      setSelectedIndex(-1);
    } else {
      setIsOpen(false);
    }
  }, [searchTerm]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Xử lý phím điều hướng (Mũi tên lên / xuống / Enter / Escape)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'Enter') onScrollToCatalog();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < matchingProducts.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : matchingProducts.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && matchingProducts[selectedIndex]) {
        router.push(`/product-detail/${matchingProducts[selectedIndex].id}`);
        setIsOpen(false);
      } else {
        setIsOpen(false);
        onScrollToCatalog();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelectProduct = (productId: number) => {
    setIsOpen(false);
    router.push(`/product-detail/${productId}`);
  };

  const handleApplyTag = (tag: string) => {
    onSearchTermChange(tag);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleClear = () => {
    onSearchTermChange('');
    setIsOpen(false);
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <section className="page-section hero-section relative overflow-hidden" id="hero">
      {/* Lớp nền Cross-fade điện ảnh (Item 16) */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-out z-0 ${
          isBgLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.55)), url('/img/products/fashion-mood-board.jpg')",
        }}
      />
      <div className="hero-backdrop">
        <h1 className="hero-watermark">AETHELGARD</h1>
      </div>

      <div className="hero-content-wrapper">
        <h2 className="hero-tagline">Mọi Thứ Bạn Cần</h2>
        <p className="hero-subtitle">
          Khám phá bộ sưu tập thời trang, sneaker & phụ kiện cao cấp tích hợp AI
        </p>

        {/* THẺ THANH TÌM KIẾM NỔI KÈM MENU GỢI Ý DROPDOWN */}
        <div className="relative w-full max-w-[760px] mx-auto z-40 text-left" ref={containerRef}>
          <div className="search-floating-card relative">
            <div className="search-box relative flex items-center w-full">
              <Search className="w-5 h-5 text-slate-400 mr-2 shrink-0 hidden sm:block" />
              <input
                ref={inputRef}
                type="text"
                id="search-input"
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                onFocus={() => {
                  if (searchTerm.trim().length > 0) setIsOpen(true);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Tìm kiếm sản phẩm trên Aethelgard Mall..."
                aria-label="Tìm kiếm sản phẩm"
                autoComplete="off"
                className="w-full"
              />

              {/* Nút xóa nhanh từ khóa (X) */}
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 mr-2 rounded-full hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title="Xóa từ khóa"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                id="search-btn"
                className="btn-search shrink-0"
                onClick={() => {
                  setIsOpen(false);
                  onScrollToCatalog();
                }}
                type="button"
              >
                Tìm Kiếm
              </button>
            </div>
          </div>

          {/* DANH SÁCH GỢI Ý THỜI GIAN THỰC (AUTOCOMPLETE DROPDOWN) */}
          {isOpen && searchTerm.trim().length > 0 && (
            <div
              className="absolute left-0 right-0 top-[calc(100%+10px)] bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 transition-all text-slate-800"
              style={{
                boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              }}
            >
              {/* Header gợi ý */}
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold text-slate-700">
                    Gợi ý trực tiếp cho: <span className="text-purple-700">&ldquo;{searchTerm}&rdquo;</span>
                  </span>
                </div>
                <span className="text-[11px] font-semibold bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-100">
                  {totalMatchesCount} kết quả
                </span>
              </div>

              {/* Gợi ý thương hiệu & danh mục bổ trợ (nếu có) */}
              {(matchedBrands.length > 0 || matchedCategories.length > 0) && (
                <div className="px-5 py-2.5 bg-purple-50/40 border-b border-purple-100/60 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-[11px] font-bold text-purple-900 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Khám phá nhanh:
                  </span>
                  {matchedBrands.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => handleApplyTag(b)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 text-purple-700 hover:bg-purple-600 hover:text-white font-medium text-xs transition-all cursor-pointer shadow-xs"
                    >
                      Thương hiệu: <strong>{b}</strong>
                    </button>
                  ))}
                  {matchedCategories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleApplyTag(c.name)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-800 hover:text-white font-medium text-xs transition-all cursor-pointer shadow-xs"
                    >
                      Danh mục: <strong>{c.name}</strong>
                    </button>
                  ))}
                </div>
              )}

              {/* Danh sách các sản phẩm gợi ý hàng đầu */}
              {matchingProducts.length > 0 ? (
                <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
                  {matchingProducts.map((p, idx) => {
                    const isSelected = selectedIndex === idx;
                    const brand = extractBrand(p);
                    const isInStock = (p.stockQuantity ?? 0) > 0;

                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProduct(p.id)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex items-center justify-between p-3.5 px-5 transition-all cursor-pointer group ${
                          isSelected ? 'bg-purple-50/90' : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Ảnh và thông tin sản phẩm */}
                        <div className="flex items-center gap-3.5 min-w-0 pr-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center">
                            {p.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = '/img/home/1.jpg';
                                }}
                              />
                            ) : (
                              <Package className="w-6 h-6 text-slate-400" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              {brand && (
                                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                                  {brand}
                                </span>
                              )}
                              <span className="text-[11px] text-slate-400 font-mono">
                                {p.sku || `#${p.id}`}
                              </span>
                            </div>
                            <h4 className="text-sm font-semibold text-slate-900 truncate group-hover:text-sky-600 transition-colors">
                              {p.name}
                            </h4>
                          </div>
                        </div>

                        {/* Giá tiền & Tồn kho */}
                        <div className="text-right shrink-0 flex flex-col items-end">
                          <span className="text-sm font-extrabold text-slate-900">
                            {formatVND(p.basePrice)}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                              isInStock
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {isInStock ? 'Còn hàng' : 'Hết hàng'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Trạng thái không có kết quả */
                <div className="p-8 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">
                    Không tìm thấy sản phẩm nào khớp với &ldquo;{searchTerm}&rdquo;
                  </h4>
                  <p className="text-xs text-slate-500 mb-4">
                    Thử tìm với tên thương hiệu hoặc từ khóa thông dụng:
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {POPULAR_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleApplyTag(tag)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-purple-800 transition-all cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer điều hướng xem tất cả */}
              {matchingProducts.length > 0 && (
                <div className="p-3 bg-slate-50/80 border-t border-slate-100 px-5 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Nhấn <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono shadow-2xs">Enter</kbd> hoặc click để xem tất cả
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onScrollToCatalog();
                    }}
                    className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1.5 hover:underline cursor-pointer"
                  >
                    <span>Xem tất cả {totalMatchesCount} sản phẩm</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div
          className="scroll-down-indicator cursor-pointer select-none"
          onClick={onScrollToCatalog}
          role="button"
          tabIndex={0}
          title="Cuộn xuống khám phá sản phẩm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') onScrollToCatalog();
          }}
        >
          <span>Cuộn xuống khám phá sản phẩm</span>
          <div className="scroll-arrow">&darr;</div>
        </div>
      </div>
    </section>
  );
};
