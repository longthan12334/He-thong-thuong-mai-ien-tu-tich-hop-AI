'use client';

import React from 'react';
import { Calendar, Search, X } from 'lucide-react';

interface OrderFilterBarProps {
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  dateFilter?: string;
  onDateFilterChange?: (filter: string) => void;
  counts: {
    all: number;
    pending: number;
    confirmed: number;
    shipped: number;
    delivered: number;
  };
}

const TABS = [
  { id: 'ALL', label: 'Tất Cả', countKey: 'all' },
  { id: 'PENDING', label: 'Chờ Duyệt', countKey: 'pending' },
  { id: 'CONFIRMED', label: 'Đã Xác Nhận', countKey: 'confirmed' },
  { id: 'SHIPPED', label: 'Đang Giao', countKey: 'shipped' },
  { id: 'DELIVERED', label: 'Đã Giao', countKey: 'delivered' },
] as const;

export const OrderFilterBar: React.FC<OrderFilterBarProps> = ({
  currentFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  dateFilter = 'ALL',
  onDateFilterChange,
  counts,
}) => {
  return (
    <div className="orders-filter-bar flex-wrap gap-3 items-center justify-between">
      {/* Tab trạng thái dạng Sliding Pill (Item 4) */}
      <div className="orders-tab-group relative p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 inline-flex gap-1">
        {TABS.map((tab) => {
          const isActive = currentFilter === tab.id;
          const count = counts[tab.countKey as keyof typeof counts] || 0;
          return (
            <button
              key={tab.id}
              onClick={() => onFilterChange(tab.id)}
              type="button"
              className={`relative px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ease-out cursor-pointer ${
                isActive
                  ? 'bg-sky-600 text-white shadow-sm scale-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`ml-1 text-[11px] font-semibold transition-opacity duration-300 ${
                  isActive ? 'opacity-90' : 'opacity-60'
                }`}
              >
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 ml-auto flex-wrap">
        {/* Bộ lọc khoảng ngày đặt hàng (Item 10) */}
        {onDateFilterChange && (
          <div className="flex items-center gap-1 bg-white border border-slate-200/90 rounded-xl px-2 py-1 shadow-2xs hover:border-slate-300 transition-colors">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={dateFilter}
              onChange={(e) => onDateFilterChange(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-transparent pr-1 pl-1 py-0.5 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Mọi thời gian</option>
              <option value="TODAY">Hôm nay</option>
              <option value="7DAYS">7 ngày qua</option>
              <option value="THIS_MONTH">Tháng này</option>
            </select>
          </div>
        )}

        {/* Ô tìm kiếm mở rộng mượt mà khi focus (Item 12 & 46) */}
        <div className="relative flex items-center transition-all duration-300 ease-in-out w-48 sm:w-64 focus-within:w-72 sm:focus-within:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            id="orders-search-input"
            placeholder="Tìm mã đơn, tên khách, tracking..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 pl-9 pr-8 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer transition-colors"
              title="Xóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
