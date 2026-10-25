'use client';

import React from 'react';
import type { Product } from '@/types';
import { formatVND } from '@/lib/utils';
import { extractBrand } from '@/lib/customer';

interface SellerProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
}

export const SellerProductCard: React.FC<SellerProductCardProps> = ({ product, onClick }) => {
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

  return (
    <div
      className="product-card group cursor-pointer"
      onClick={() => onClick(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick(product);
        }
      }}
    >
      <div className="product-card-top flex justify-between items-center">
        <span className="category-tag-top">{product.categoryName || 'Thời Trang'}</span>
        {product.discountPercent && product.discountPercent > 0 ? (
          <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            -{product.discountPercent}%
          </span>
        ) : null}
      </div>

      <div className="product-img-box">
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/img/products/adidas-samba.jpg';
          }}
        />
      </div>

      <div className="product-info">
        {brand && <div className="product-brand">{brand}</div>}
        <h3 className="product-title" title={product.name}>
          {title || product.name}
        </h3>
        <div className="product-rating-row">
          <span>★ {Number(product.rating || 5.0).toFixed(1)}</span>
          <span className="review-count">({product.reviewCount || 40} Đánh giá)</span>
        </div>
        <div className="product-price-row">
          <span className="price-amount">{formatVND(product.basePrice)}</span>
        </div>
        <div className="product-seller-footer">
          <span className="card-sku-code" title={`SKU: ${product.sku}`}>
            SKU: {product.sku}
          </span>
          <span className="card-seller-cta">
            Quản lý kho &rarr;
          </span>
        </div>
      </div>
    </div>
  );
};
