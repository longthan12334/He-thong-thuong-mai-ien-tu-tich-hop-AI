'use client';

import React, { useState } from 'react';
import type { Product } from '@/types';
import { formatVND } from '@/lib/utils';
import { extractBrand } from '@/lib/customer';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SellerProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
}

const SellerProductCardComponent: React.FC<SellerProductCardProps> = ({ product, onClick }) => {
  // Trích xuất thương hiệu và tên tác phẩm
  const parseProductName = (rawName: string) => {
    if (rawName && rawName.includes(' - ')) {
      const idx = rawName.indexOf(' - ');
      return {
        brand: rawName.substring(0, idx).trim(),
        title: rawName.substring(idx + 3).trim(),
      };
    }
    const detected = extractBrand(product);
    return {
      brand: detected || '',
      title: rawName,
    };
  };

  const { brand, title } = parseProductName(product.name);

  // Danh sách hình ảnh góc nhìn thực tế (Image 2 & 3)
  const images = (product.galleryUrls && product.galleryUrls.length > 0)
    ? [product.imageUrl, ...product.galleryUrls.filter((u) => u && u !== product.imageUrl)]
    : [product.imageUrl];

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div
      className="luxury-editorial-card group cursor-pointer flex flex-col transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-xl rounded-xl"
      onClick={() => onClick(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick(product);
        }
      }}
    >
      {/* 1. KHUNG ẢNH NGHỆ THUẬT XA XỈ (BORDERLESS, STUDIO CANVAS NHƯ GUCCI.COM) */}
      <div className="luxury-canvas-box relative w-full aspect-[4/5] bg-[#F9F9F9] rounded-sm overflow-hidden flex items-center justify-center p-6 transition-colors duration-300 group-hover:bg-[#F4F4F4]">
        {/* Tag giảm giá hoặc bộ sưu tập tối giản */}
        {product.discountPercent && product.discountPercent > 0 ? (
          <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider text-slate-900 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded shadow-sm z-10">
            -{product.discountPercent}%
          </span>
        ) : null}

        {/* Nút lật ảnh trước (<) phong cách Gucci (Image 3) */}
        {images.length > 1 && (
          <button
            type="button"
            aria-label="Ảnh trước"
            onClick={handlePrevImage}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-800 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 backdrop-blur-sm cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Ảnh chính của sản phẩm */}
        <div className="w-full h-full flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[activeImageIndex] || product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="max-w-full max-h-full object-contain mix-blend-multiply transition-transform duration-500 ease-out group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/img/products/adidas-samba.jpg';
            }}
          />
        </div>

        {/* Nút lật ảnh sau (>) phong cách Gucci (Image 3) */}
        {images.length > 1 && (
          <button
            type="button"
            aria-label="Ảnh kế tiếp"
            onClick={handleNextImage}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-800 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 backdrop-blur-sm cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Thanh chỉ báo tiến độ dạng vạch ngang sát đáy ảnh (Image 3) */}
        {images.length > 1 && (
          <div className="absolute bottom-2.5 left-6 right-6 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={`h-[2px] flex-1 rounded-full transition-all duration-300 ${
                  idx === activeImageIndex ? 'bg-slate-900' : 'bg-slate-300'
                }`}
              />
            ))}
          </div>
        )}


      </div>

      {/* 2. THÔNG TIN SẢN PHẨM PHONG CÁCH TỐI GIẢN (CANH TRÁI, THANH LỊCH) */}
      <div className="luxury-meta-box pt-3.5 pb-2 flex flex-col text-left">
        {/* Thương hiệu & Danh mục tinh giản */}
        <div className="flex items-center justify-between text-[11px] font-bold tracking-[0.16em] uppercase text-slate-500 mb-1">
          <span>{brand || product.categoryName || 'LUXURY'}</span>
          <span className="text-slate-400 font-normal">★ {Number(product.rating || 5.0).toFixed(1)}</span>
        </div>

        {/* Tên tác phẩm thời trang */}
        <h3
          className="luxury-title-text text-sm font-medium text-slate-900 leading-snug line-clamp-1 group-hover:text-sky-600 transition-colors duration-200 mb-1"
          title={product.name}
        >
          {title || product.name}
        </h3>

        {/* Giá niêm yết chính hãng */}
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-sm font-bold text-slate-900 tracking-tight">
            {formatVND(product.basePrice)}
          </span>
          {product.originalPrice && product.originalPrice > product.basePrice ? (
            <span className="text-xs text-slate-400 line-through">
              {formatVND(product.originalPrice)}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export const SellerProductCard = React.memo(SellerProductCardComponent);
