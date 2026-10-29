'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/types';
import type { ProductSnapshot } from '@/contexts/ShopperContext';
import { useShopper } from '@/contexts/ShopperContext';
import { useToast } from '@/hooks/useToast';
import { formatVND } from '@/lib/utils';
import { FALLBACK_IMAGE } from '@/lib/constants';
import { extractBrand } from '@/lib/customer';

interface CustomerProductCardProps {
  product: Product | ProductSnapshot;
  /** Dòng lý do gợi ý (bộ máy gợi ý cá nhân hóa) — hiển thị thay cho SKU ở chân thẻ */
  reason?: string;
}

/**
 * Thẻ sản phẩm phía Khách hàng.
 * Dùng lại nguyên bộ class `.product-card` của sàn để giữ đồng nhất giao diện,
 * nhưng KHÔNG hiển thị dữ liệu nội bộ của Seller và dẫn thẳng tới trang chi tiết.
 */
export const CustomerProductCard: React.FC<CustomerProductCardProps> = ({ product, reason }) => {
  const router = useRouter();
  const { isInWishlist, toggleWishlist } = useShopper();
  const { showToast } = useToast();
  const liked = isInWishlist(product.id);

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

  const { brand: parsedBrand, title: parsedTitle } = parseProductName(product.name);
  const brand = parsedBrand || extractBrand(product);
  const hasDiscount = (product.discountPercent || 0) > 0;
  const showOriginal = !!product.originalPrice && product.originalPrice > product.basePrice;
  const outOfStock = (product.stockQuantity ?? 1) <= 0 || product.stockStatus === 'OUT_OF_STOCK' || product.stockStatus === 'OutOfStock';

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleWishlist(product);
    showToast(added ? 'Đã thêm vào danh sách yêu thích' : 'Đã gỡ khỏi danh sách yêu thích');
  };

  return (
    <div
      className="product-card customer-product-card group"
      role="link"
      tabIndex={0}
      aria-label={`Xem chi tiết ${product.name}`}
      onClick={() => router.push(`/product-detail/${product.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') router.push(`/product-detail/${product.id}`);
      }}
    >
      <div className="product-card-top flex justify-between items-center">
        <span className="category-tag-top">{product.categoryName || 'Thời Trang'}</span>
        <div className="flex items-center gap-1.5">
          {hasDiscount && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              -{product.discountPercent}%
            </span>
          )}
          <button
            type="button"
            onClick={handleWishlist}
            className={`customer-wishlist-btn ${liked ? 'active' : ''}`}
            aria-label={liked ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
            title={liked ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
          >
            {liked ? '♥' : '♡'}
          </button>
        </div>
      </div>

      <div className="product-img-box">
        <img
          src={product.imageUrl || FALLBACK_IMAGE}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
          }}
        />
        {outOfStock && <span className="customer-soldout-tag">Tạm hết hàng</span>}
      </div>

      <div className="product-info">
        {brand && (
          <div
            className="product-brand inline-flex items-center gap-1 hover:text-sky-600 transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              const prodSellerId = 'sellerId' in product ? (product as any).sellerId : undefined;
              const shopUrl = prodSellerId
                ? `/shop-profile?sellerId=${prodSellerId}&brand=${encodeURIComponent(brand)}`
                : `/shop-profile?brand=${encodeURIComponent(brand)}`;
              router.push(shopUrl);
            }}
            title={`Xem gian hàng chính hãng ${brand}`}
          >
            <span>{brand}</span>
            <span className="text-[10px] text-slate-400">↗</span>
          </div>
        )}
        <h3 className="product-title" title={product.name}>
          {parsedTitle || product.name}
        </h3>
        <div className="product-rating-row">
          <span>★ {(product.rating || 0).toFixed(1)}</span>
          <span className="review-count">({product.reviewCount || 0} đánh giá)</span>
        </div>
        <div className="product-price-row customer-price-row">
          {showOriginal && <span className="customer-price-original">{formatVND(product.originalPrice!)}</span>}
          <span className="price-amount">{formatVND(product.basePrice)}</span>
        </div>
        <div className="product-seller-footer">
          {reason ? (
            <span className="customer-reason-tag">✦ {reason}</span>
          ) : (
            <span className="customer-auth-tag">✓ Chính hãng 100%</span>
          )}
          <span className="card-seller-cta">Xem chi tiết &rarr;</span>
        </div>
      </div>
    </div>
  );
};
