'use client';

import React, { useState } from 'react';
import type { Category } from '@/types';
import { SlidersHorizontal, X, RotateCcw, Search } from 'lucide-react';

interface ProductFiltersProps {
  categories: Category[];
  totalProductsCount: number;
  filteredCount?: number;
  categoryFilter: string;
  onCategoryChange: (val: string) => void;
  quickFilterType: string;
  onQuickFilterChange: (val: string) => void;
  minPrice: string;
  onMinPriceChange: (val: string) => void;
  maxPrice: string;
  onMaxPriceChange: (val: string) => void;
  sortOrder: string;
  onSortOrderChange: (val: string) => void;
  onReset: () => void;
  searchTerm?: string;
  onSearchTermChange?: (val: string) => void;
}

const PRICE_PRESETS = [
  { label: 'Dưới 15 triệu', min: '', max: '15000000' },
  { label: '15 – 30 triệu', min: '15000000', max: '30000000' },
  { label: '30 – 50 triệu', min: '30000000', max: '50000000' },
  { label: 'Trên 50 triệu', min: '50000000', max: '' },
];

/** Rút gọn tên danh mục để hiển thị ngắn gọn, thanh lịch */
function simplifyCategoryName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('giày') || lower.includes('sneaker')) return 'GIÀY DÉP';
  if (lower.includes('trang phục') || lower.includes('quần') || lower.includes('áo')) return 'TRANG PHỤC';
  if (lower.includes('túi') || lower.includes('balo')) return 'TÚI XÁCH';
  if (lower.includes('kính')) return 'KÍNH MẮT';
  if (lower.includes('phụ kiện') || lower.includes('đồ da')) return 'PHỤ KIỆN';
  if (lower.includes('trang sức') || lower.includes('đồng hồ')) return 'TRANG SỨC';
  return name.toUpperCase();
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  totalProductsCount,
  filteredCount,
  categoryFilter,
  onCategoryChange,
  quickFilterType,
  onQuickFilterChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  sortOrder,
  onSortOrderChange,
  onReset,
  searchTerm,
  onSearchTermChange,
}) => {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const getSortName = (order: string) => {
    switch (order) {
      case 'price_asc':
        return 'Giá: Thấp → Cao';
      case 'price_desc':
        return 'Giá: Cao → Thấp';
      case 'rating':
        return 'Đánh giá cao nhất';
      case 'newest':
      default:
        return 'Khuyên dùng';
    }
  };

  const hasActiveFilters = Boolean(
    categoryFilter || quickFilterType || minPrice || maxPrice || sortOrder !== 'newest' || searchTerm
  );

  return (
    <div className="w-full mb-6">
      {/* 1. THANH DANH MỤC CHÍNH CHỮ ĐEN KHÔNG NỀN — STICKY DƯỚI HEADER Ở GÓC TRÊN CÙNG BÊN TRÁI */}
      <div className="sticky top-16 z-30 w-full bg-white/75 backdrop-blur-md py-2.5 -mx-4 px-4 sm:-mx-8 sm:px-8 transition-all border-b border-black/5">
        <div className="flex items-center justify-between gap-4">
          {/* Chỉ hiển thị các danh mục chính cốt lõi */}
          <div className="flex items-center justify-start gap-6 sm:gap-8 overflow-x-auto no-scrollbar whitespace-nowrap min-w-0 pr-2">
            {/* Nút Tất Cả */}
            <button
              type="button"
              onClick={() => {
                onCategoryChange('');
                onQuickFilterChange('');
              }}
              className={`text-[11px] tracking-[0.14em] uppercase transition-all pb-0.5 cursor-pointer shrink-0 ${
                categoryFilter === '' && quickFilterType === ''
                  ? 'font-extrabold text-black border-b-2 border-black'
                  : 'font-semibold text-neutral-500 hover:text-black'
              }`}
            >
              TẤT CẢ ({totalProductsCount})
            </button>

            {/* Chỉ các danh mục chính */}
            {categories.slice(0, 6).map((cat) => {
              const isCatActive = categoryFilter === String(cat.id);
              const displayName = simplifyCategoryName(cat.name);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    onCategoryChange(isCatActive ? '' : String(cat.id));
                    onQuickFilterChange('');
                  }}
                  className={`text-[11px] tracking-[0.14em] uppercase transition-all pb-0.5 cursor-pointer shrink-0 ${
                    isCatActive
                      ? 'font-extrabold text-black border-b-2 border-black'
                      : 'font-semibold text-neutral-500 hover:text-black'
                  }`}
                >
                  {displayName}
                </button>
              );
            })}
          </div>

          {/* Ô tìm kiếm tức thời tối giản & Nút Bộ lọc gọn gàng ở góc phải */}
          <div className="shrink-0 flex items-center gap-2">
            {onSearchTermChange && (
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm || ''}
                  onChange={(e) => onSearchTermChange(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm..."
                  className="h-8 pl-8 pr-6 text-xs rounded-full border border-neutral-200 bg-neutral-50/80 focus:bg-white focus:outline-none focus:border-black w-32 sm:w-44 focus:w-48 sm:focus:w-64 transition-all duration-300 ease-in-out shadow-2xs"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => onSearchTermChange('')}
                    className="absolute right-2 text-neutral-400 hover:text-black cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase transition-all cursor-pointer border ${
                isFilterDrawerOpen || hasActiveFilters
                  ? 'bg-black text-white border-black shadow-sm'
                  : 'bg-transparent text-neutral-800 border-neutral-300 hover:border-black hover:text-black'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span className="hidden sm:inline">Bộ lọc</span>
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              )}
            </button>
          </div>
        </div>

        {/* Dòng trạng thái số lượng sản phẩm & sắp xếp */}
        <div className="flex items-center justify-between pt-1.5 text-[10.5px] text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-800">
              {filteredCount !== undefined ? filteredCount : totalProductsCount} sản phẩm
            </span>
            <span>•</span>
            <span>sắp xếp: <strong className="text-black font-semibold">{getSortName(sortOrder)}</strong></span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onReset}
                className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. DRAWER BỘ LỌC CHI TIẾT DẠNG ACCORDION MƯỢT MÀ (Item 6) */}
      <div
        className={`grid transition-all duration-300 ease-in-out overflow-hidden ${
          isFilterDrawerOpen
            ? 'grid-rows-[1fr] opacity-100 mt-3'
            : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'
        }`}
      >
        <div className="min-h-0">
          <div className="relative p-4 sm:p-5 rounded-2xl bg-neutral-50/90 border border-neutral-200/80 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200/60 mb-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-black" />
              <h4 className="text-xs font-bold tracking-wider uppercase text-black">
                Bộ Lọc & Sắp Xếp Nâng Cao
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(false)}
              className="text-neutral-400 hover:text-black transition-colors cursor-pointer p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cột 1: Sắp xếp */}
            <div>
              <span className="block text-[11px] font-bold tracking-wider uppercase text-neutral-400 mb-2">
                Thứ Tự Hiển Thị
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'newest', label: 'Khuyên Dùng' },
                  { id: 'rating', label: 'Đánh Giá Cao' },
                  { id: 'price_asc', label: 'Giá Tăng Dần' },
                  { id: 'price_desc', label: 'Giá Giảm Dần' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onSortOrderChange(s.id)}
                    className={`py-2 px-2.5 text-xs rounded-xl font-medium transition-all text-left border ${
                      sortOrder === s.id
                        ? 'bg-black text-white border-black font-semibold'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:border-black'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cột 2: Mức giá định sẵn */}
            <div>
              <span className="block text-[11px] font-bold tracking-wider uppercase text-neutral-400 mb-2">
                Khoảng Giá Nhanh
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {PRICE_PRESETS.map((p, idx) => {
                  const isSelected = minPrice === p.min && maxPrice === p.max;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          onMinPriceChange('');
                          onMaxPriceChange('');
                        } else {
                          onMinPriceChange(p.min);
                          onMaxPriceChange(p.max);
                        }
                      }}
                      className={`py-2 px-2.5 text-xs rounded-xl font-medium transition-all text-left border ${
                        isSelected
                          ? 'bg-black text-white border-black font-semibold'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:border-black'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cột 3: Nhập giá tùy biến */}
            <div>
              <span className="block text-[11px] font-bold tracking-wider uppercase text-neutral-400 mb-2">
                Khoảng Giá Tùy Chọn (₫)
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Từ (₫)"
                  value={minPrice}
                  onChange={(e) => onMinPriceChange(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-neutral-200 bg-white text-xs focus:outline-none focus:border-black"
                />
                <span className="text-neutral-400 text-xs">—</span>
                <input
                  type="number"
                  placeholder="Đến (₫)"
                  value={maxPrice}
                  onChange={(e) => onMaxPriceChange(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-neutral-200 bg-white text-xs focus:outline-none focus:border-black"
                />
              </div>

              {hasActiveFilters && (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={onReset}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Xóa toàn bộ bộ lọc</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};
