'use client';

import React from 'react';
import type { Category } from '@/types';

export interface CustomerFilterState {
  categoryId: string;
  brand: string;
  quick: '' | 'newest' | 'bestseller' | 'discount' | 'top_rated';
  minPrice: string;
  maxPrice: string;
  sort: 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'rating';
  inStockOnly: boolean;
}

export const DEFAULT_CUSTOMER_FILTERS: CustomerFilterState = {
  categoryId: '',
  brand: '',
  quick: '',
  minPrice: '',
  maxPrice: '',
  sort: 'newest',
  inStockOnly: false,
};

interface CustomerFiltersProps {
  categories: (Category & { visibleCount: number })[];
  brands: { name: string; count: number }[];
  totalProductsCount: number;
  value: CustomerFilterState;
  onChange: (next: Partial<CustomerFilterState>) => void;
  onReset: () => void;
}

const PRICE_PRESETS = [
  { label: 'Dưới 3 triệu', min: '', max: '3000000' },
  { label: '3 – 10 triệu', min: '3000000', max: '10000000' },
  { label: '10 – 50 triệu', min: '10000000', max: '50000000' },
  { label: 'Trên 50 triệu', min: '50000000', max: '' },
];

/**
 * Sidebar bộ lọc phía Khách hàng.
 * Dùng nguyên bộ class `.sidebar-filters / .category-subnav / .quick-link / .price-inputs` của sàn,
 * nhưng danh mục & thương hiệu lấy từ dữ liệu thực (API) kèm số lượng sản phẩm.
 */
export const CustomerFilters: React.FC<CustomerFiltersProps> = ({
  categories,
  brands,
  totalProductsCount,
  value,
  onChange,
  onReset,
}) => {
  return (
    <aside className="sidebar-filters customer-filters">
      <div className="sidebar-header">
        <h3>Danh Mục</h3>
      </div>

      <ul className="category-subnav">
        <li
          className={`subnav-item ${value.categoryId === '' ? 'active' : ''}`}
          onClick={() => onChange({ categoryId: '' })}
          style={{ cursor: 'pointer' }}
        >
          <span>Tất Cả Sản Phẩm</span>
          <span className="count-tag">{totalProductsCount}</span>
        </li>
        {categories.map((c) => (
          <li
            key={c.id}
            className={`subnav-item ${value.categoryId === String(c.id) ? 'active' : ''}`}
            onClick={() => onChange({ categoryId: String(c.id) })}
            style={{ cursor: 'pointer' }}
          >
            <span>{c.name}</span>
            <span className="count-tag">{c.visibleCount}</span>
          </li>
        ))}
      </ul>

      <div className="filter-divider" />

      <div className="quick-nav-links">
        {(
          [
            ['newest', 'Hàng Mới Về'],
            ['bestseller', 'Bán Chạy Nhất'],
            ['discount', 'Đang Giảm Giá'],
            ['top_rated', 'Đánh Giá Cao'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`quick-link text-left bg-transparent border-0 cursor-pointer ${value.quick === key ? 'font-bold' : ''}`}
            onClick={() => onChange({ quick: value.quick === key ? '' : key })}
          >
            {label}
          </button>
        ))}
      </div>

      {brands.length > 0 && (
        <>
          <div className="filter-divider" />
          <div className="filter-group">
            <label htmlFor="customer-brand-select" className="filter-label">
              Thương Hiệu
            </label>
            <select
              id="customer-brand-select"
              className="form-control"
              value={value.brand}
              onChange={(e) => onChange({ brand: e.target.value })}
            >
              <option value="">Tất cả thương hiệu</option>
              {brands.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name} ({b.count})
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <div className="filter-divider" />

      <div className="filter-group">
        <label className="filter-label">Khoảng Giá (VNĐ)</label>
        <div className="price-inputs">
          <input
            type="number"
            placeholder="Từ giá"
            min="0"
            className="form-control"
            value={value.minPrice}
            onChange={(e) => onChange({ minPrice: e.target.value })}
          />
          <span>-</span>
          <input
            type="number"
            placeholder="Đến giá"
            min="0"
            className="form-control"
            value={value.maxPrice}
            onChange={(e) => onChange({ maxPrice: e.target.value })}
          />
        </div>
        <div className="customer-price-presets">
          {PRICE_PRESETS.map((p) => {
            const active = value.minPrice === p.min && value.maxPrice === p.max;
            return (
              <button
                key={p.label}
                type="button"
                className={`customer-chip ${active ? 'active' : ''}`}
                onClick={() => onChange(active ? { minPrice: '', maxPrice: '' } : { minPrice: p.min, maxPrice: p.max })}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="filter-group">
        <label className="customer-checkbox">
          <input
            type="checkbox"
            checked={value.inStockOnly}
            onChange={(e) => onChange({ inStockOnly: e.target.checked })}
          />
          <span>Chỉ hiện sản phẩm còn hàng</span>
        </label>
      </div>

      <div className="filter-group">
        <label htmlFor="customer-sort-select" className="filter-label">
          Sắp Xếp Theo
        </label>
        <select
          id="customer-sort-select"
          className="form-control"
          value={value.sort}
          onChange={(e) => onChange({ sort: e.target.value as CustomerFilterState['sort'] })}
        >
          <option value="newest">Hàng mới nhất</option>
          <option value="popular">Phổ biến nhất</option>
          <option value="rating">Đánh giá cao nhất</option>
          <option value="price_asc">Giá: Thấp đến Cao</option>
          <option value="price_desc">Giá: Cao đến Thấp</option>
        </select>
      </div>

      <button className="btn-secondary btn-full" onClick={onReset} type="button">
        Đặt Lại Bộ Lọc
      </button>
    </aside>
  );
};
