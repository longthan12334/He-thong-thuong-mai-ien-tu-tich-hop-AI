'use client';

import React from 'react';
import type { Category } from '@/types';

interface ProductFiltersProps {
  categories: Category[];
  totalProductsCount: number;
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
}

const PRICE_PRESETS = [
  { label: 'Dưới 15 triệu', min: '', max: '15000000' },
  { label: '15 – 30 triệu', min: '15000000', max: '30000000' },
  { label: '30 – 50 triệu', min: '30000000', max: '50000000' },
  { label: 'Trên 50 triệu', min: '50000000', max: '' },
];

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  totalProductsCount,
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
}) => {
  return (
    <aside className="sidebar-filters">
      <div className="sidebar-header">
        <h3>Danh Mục Ngành Hàng</h3>
      </div>

      {/* Menu danh mục Haute Couture đồng bộ dữ liệu thật */}
      <ul className="category-subnav">
        <li
          className={`subnav-item ${categoryFilter === '' ? 'active' : ''}`}
          onClick={() => onCategoryChange('')}
          style={{ cursor: 'pointer' }}
        >
          <span>Tất Cả Sản Phẩm</span>
          <span className="count-tag">{totalProductsCount}</span>
        </li>
        {categories.map((c) => (
          <li
            key={c.id}
            className={`subnav-item ${categoryFilter === String(c.id) ? 'active' : ''}`}
            onClick={() => onCategoryChange(String(c.id))}
            style={{ cursor: 'pointer' }}
          >
            <span>{c.name}</span>
            <span className="count-tag">{c.productCount ?? 0}</span>
          </li>
        ))}
      </ul>

      <div className="filter-divider" />

      {/* Lọc tiêu chí nhanh */}
      <div className="sidebar-header" style={{ marginBottom: '8px' }}>
        <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Tiêu Chí Tuyển Chọn
        </h4>
      </div>
      <div className="quick-nav-links">
        <button
          type="button"
          className={`quick-link text-left bg-transparent border-0 cursor-pointer ${
            quickFilterType === 'newest' ? 'font-bold' : ''
          }`}
          onClick={() => {
            onQuickFilterChange('newest');
            onSortOrderChange('newest');
          }}
        >
          ✦ Hàng Mới Về
        </button>
        <button
          type="button"
          className={`quick-link text-left bg-transparent border-0 cursor-pointer ${
            quickFilterType === 'bestseller' ? 'font-bold' : ''
          }`}
          onClick={() => onQuickFilterChange('bestseller')}
        >
          ★ Kiệt Tác Bán Chạy
        </button>
        <button
          type="button"
          className={`quick-link text-left bg-transparent border-0 cursor-pointer ${
            quickFilterType === 'discount' ? 'font-bold' : ''
          }`}
          onClick={() => onQuickFilterChange('discount')}
        >
          🏷 Ưu Đãi Đặc Biệt
        </button>
      </div>

      <div className="filter-divider" />

      {/* Lọc theo phân khúc giá hàng hiệu */}
      <div className="filter-group">
        <label className="filter-label">Phân Khúc Giá (VNĐ)</label>
        
        {/* Nút chọn nhanh khoảng giá */}
        <div className="grid grid-cols-2 gap-1.5 mb-2.5">
          {PRICE_PRESETS.map((p) => {
            const isActive = minPrice === p.min && maxPrice === p.max;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  if (isActive) {
                    onMinPriceChange('');
                    onMaxPriceChange('');
                  } else {
                    onMinPriceChange(p.min);
                    onMaxPriceChange(p.max);
                  }
                }}
                className={`text-[11px] py-1.5 px-2 rounded-lg border font-medium text-center transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 border-slate-900 text-white font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Ô nhập tùy chỉnh */}
        <div className="price-inputs">
          <input
            type="number"
            id="min-price"
            placeholder="Từ giá"
            min="0"
            className="form-control"
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.target.value)}
          />
          <span>-</span>
          <input
            type="number"
            id="max-price"
            placeholder="Đến giá"
            min="0"
            className="form-control"
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
          />
        </div>
      </div>

      {/* Sắp xếp */}
      <div className="filter-group">
        <label htmlFor="sort-select" className="filter-label">
          Sắp Xếp Showroom
        </label>
        <select
          id="sort-select"
          className="form-control font-medium"
          value={sortOrder}
          onChange={(e) => onSortOrderChange(e.target.value)}
        >
          <option value="newest">Showroom tuyển chọn (Xen kẽ)</option>
          <option value="price_asc">Giá: Thấp đến Cao</option>
          <option value="price_desc">Giá: Cao đến Thấp</option>
          <option value="bestseller">Được yêu thích nhất</option>
        </select>
      </div>

      <button
        id="reset-filters-btn"
        className="btn-secondary btn-full cursor-pointer hover:bg-slate-100 transition-colors"
        onClick={onReset}
        type="button"
      >
        Đặt Lại Bộ Lọc
      </button>
    </aside>
  );
};
