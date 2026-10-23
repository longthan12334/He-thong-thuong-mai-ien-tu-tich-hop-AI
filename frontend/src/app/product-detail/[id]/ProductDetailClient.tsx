'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Product } from '@/types';
import { productService } from '@/services/product.service';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { useCatalog } from '@/hooks/useCatalog';
import { useShopper } from '@/contexts/ShopperContext';
import { Modal, Skeleton } from '@/components/ui';
import { AIStylistPanel } from '@/components/customer';
import { formatVND, getInitials } from '@/lib/utils';
import { FALLBACK_IMAGE } from '@/lib/constants';
import {
  buildSpecs,
  colorToHex,
  extractBrand,
  findVariant,
  FREE_SHIPPING_THRESHOLD,
  getProductOptions,
  similarProducts,
} from '@/lib/customer';

type TabKey = 'details' | 'materials' | 'sizefit' | 'shipping';

interface LocalReview {
  id: string;
  productId: number;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const REVIEWS_KEY = 'aethelgard_reviews';
const SAME_DAY_CUTOFF_HOUR = 17; // Đơn trước 17:00 được xử lý ngay trong ngày

/** Đếm ngược tới mốc chốt đơn xử lý trong ngày (17:00), qua mốc thì tính sang ngày hôm sau */
function secondsUntilCutoff(now: Date) {
  const cutoff = new Date(now);
  cutoff.setHours(SAME_DAY_CUTOFF_HOUR, 0, 0, 0);
  if (now >= cutoff) cutoff.setDate(cutoff.getDate() + 1);
  return Math.max(0, Math.floor((cutoff.getTime() - now.getTime()) / 1000));
}

function isFootwear(p: Product) {
  const text = `${p.categoryName || ''} ${p.name}`.toLowerCase();
  return /giày|giay|sneaker|boot|loafer|sandal|dép|pump|shoe/.test(text);
}

export default function ProductDetailClient({ initialProductId }: { initialProductId?: number }) {
  const params = useParams();
  const productId = initialProductId ?? Number(params?.id);

  const { user } = useAuth();
  const { showToast } = useToast();
  const { addToCart, setIsCheckoutOpen } = useCart();
  const { isInWishlist, toggleWishlist, trackView } = useShopper();
  const { products: catalog } = useCatalog();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [activeImage, setActiveImage] = useState('');
  const [activeColor, setActiveColor] = useState('');
  const [activeSize, setActiveSize] = useState('');
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<TabKey>('details');
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(() => secondsUntilCutoff(new Date()));

  const [reviews, setReviews] = useState<LocalReview[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // 1. Tải sản phẩm thật từ Backend (productService tự fallback dữ liệu mẫu khi offline)
  useEffect(() => {
    if (!productId) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }
    let mounted = true;
    setIsLoading(true);
    setNotFound(false);
    productService
      .getProductById(productId)
      .then((p) => {
        if (!mounted) return;
        setProduct(p);
        const opts = getProductOptions(p.variants);
        setActiveImage(p.galleryUrls?.[0] || p.imageUrl || FALLBACK_IMAGE);
        setActiveColor(opts.colors.find((c) => c.stock > 0)?.value || opts.colors[0]?.value || '');
        setActiveSize('');
        setQty(1);
        setActiveTab('details');
        trackView(p);
      })
      .catch(() => mounted && setNotFound(true))
      .finally(() => mounted && setIsLoading(false));
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // 2. Đồng hồ chốt đơn trong ngày
  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft(secondsUntilCutoff(new Date())), 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. Đánh giá thực tế từ CSDL Backend
  useEffect(() => {
    if (!productId) return;
    productService.getProductReviews(productId).then((dbReviews) => {
      if (dbReviews && dbReviews.length > 0) {
        setReviews(
          dbReviews.map((r: any) => ({
            id: String(r.id),
            productId: r.productId,
            author: r.customerName || 'Khách Hàng',
            rating: r.rating || 5,
            comment: r.comment || '',
            createdAt: r.createdAt || new Date().toISOString(),
          }))
        );
      } else {
        try {
          const all: LocalReview[] = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]');
          setReviews(all.filter((r) => r.productId === productId));
        } catch {
          setReviews([]);
        }
      }
    });
  }, [productId]);

  const options = useMemo(() => getProductOptions(product?.variants), [product]);
  const selectedVariant = useMemo(
    () => findVariant(product?.variants, activeSize || undefined, activeColor || undefined),
    [product, activeSize, activeColor]
  );

  const gallery = useMemo(() => {
    if (!product) return [];
    const list = [...(product.galleryUrls || [])];
    if (product.imageUrl && !list.includes(product.imageUrl)) list.unshift(product.imageUrl);
    return list.length > 0 ? list : [FALLBACK_IMAGE];
  }, [product]);

  const related = useMemo(
    () => (product ? similarProducts(catalog, product, 4) : []),
    [catalog, product]
  );

  const brand = product ? extractBrand(product) : '';
  const brandProductCount = brand ? catalog.filter((p) => extractBrand(p) === brand).length : 0;

  // Tồn kho khả dụng theo phân loại đang chọn
  const availableStock = selectedVariant && (activeSize || !options.sizes.length)
    ? selectedVariant.stockQuantity
    : product?.stockQuantity ?? 0;
  const isOutOfStock = (product?.stockQuantity ?? 0) <= 0;
  const needsSize = options.sizes.length > 0 && !activeSize;

  useEffect(() => {
    if (availableStock > 0 && qty > availableStock) setQty(availableStock);
  }, [availableStock, qty]);

  if (isLoading) {
    return (
      <div className="profile-page-wrapper">
        <section className="product-hero-grid">
          <Skeleton className="h-[480px] w-full" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </section>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="profile-page-wrapper">
        <div className="customer-empty-state customer-empty-page">
          <h1 className="product-detail-title">Không tìm thấy sản phẩm</h1>
          <p>Sản phẩm có thể đã ngừng kinh doanh hoặc đường dẫn không chính xác.</p>
          <Link href="/shop" className="customer-link-btn">
            ← Quay lại cửa hàng
          </Link>
        </div>
      </div>
    );
  }

  const isWishlist = isInWishlist(product.id);
  const showOriginal = !!product.originalPrice && product.originalPrice > product.basePrice;
  const discount =
    product.discountPercent && product.discountPercent > 0
      ? product.discountPercent
      : showOriginal
        ? Math.round((1 - product.basePrice / product.originalPrice!) * 100)
        : 0;

  const formatTimer = () => {
    const h = String(Math.floor(secondsLeft / 3600)).padStart(2, '0');
    const m = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0');
    const s = String(secondsLeft % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const validateSelection = () => {
    if (isOutOfStock) {
      showToast('Sản phẩm tạm hết hàng');
      return false;
    }
    if (needsSize) {
      showToast('Vui lòng chọn kích cỡ trước khi thêm vào giỏ');
      document.getElementById('size-selector')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    if (availableStock <= 0) {
      showToast('Phân loại bạn chọn đã hết hàng, vui lòng chọn phân loại khác');
      return false;
    }
    return true;
  };

  const putIntoCart = () => {
    const specs = buildSpecs(activeColor || undefined, activeSize || undefined);
    addToCart({ ...product, stockQuantity: availableStock }, qty, specs);
    return specs;
  };

  const handleAddToCart = () => {
    if (!validateSelection()) return;
    const specs = putIntoCart();
    showToast(`Đã thêm ${qty} × ${product.name} (${specs}) vào giỏ hàng!`);
  };

  const handleBuyNow = () => {
    if (!validateSelection()) return;
    putIntoCart();
    setIsCheckoutOpen(true);
  };

  const handleWishlistToggle = () => {
    const added = toggleWishlist(product);
    showToast(added ? 'Đã thêm vào danh sách yêu thích!' : 'Đã xóa khỏi danh sách yêu thích!');
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewComment.trim().length < 10) {
      showToast('Nhận xét cần tối thiểu 10 ký tự');
      return;
    }
    const authorName = user?.fullName || 'Khách Hàng Aethelgard';
    try {
      const created = await productService.addProductReview(product.id, {
        customerName: authorName,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      const newRev: LocalReview = {
        id: String(created.id || Date.now()),
        productId: product.id,
        author: created.customerName || authorName,
        rating: created.rating || reviewRating,
        comment: created.comment || reviewComment.trim(),
        createdAt: created.createdAt || new Date().toISOString(),
      };
      setReviews((prev) => [newRev, ...prev]);
    } catch {
      const review: LocalReview = {
        id: `${Date.now()}`,
        productId: product.id,
        author: authorName,
        rating: reviewRating,
        comment: reviewComment.trim(),
        createdAt: new Date().toISOString(),
      };
      try {
        const all: LocalReview[] = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]');
        localStorage.setItem(REVIEWS_KEY, JSON.stringify([review, ...all]));
      } catch {
        // bỏ qua
      }
      setReviews((prev) => [review, ...prev]);
    }
    setReviewComment('');
    setReviewRating(5);
    showToast('Cảm ơn bạn đã gửi đánh giá vào hệ thống!');
  };

  const ratingScore = (product.rating || 0).toFixed(1);
  const fullStars = Math.round(product.rating || 0);
  const starText = '★★★★★'.slice(0, fullStars) + '☆☆☆☆☆'.slice(0, 5 - fullStars);
  const footwear = isFootwear(product);

  return (
    <div className="profile-page-wrapper">
      {/* BREADCRUMBS */}
      <nav className="breadcrumb-nav">
        <Link href="/shop">Cửa Hàng</Link>
        <span className="breadcrumb-separator">/</span>
        {product.categoryName && (
          <>
            <Link href={`/shop?category=${product.categoryId}`}>{product.categoryName}</Link>
            <span className="breadcrumb-separator">/</span>
          </>
        )}
        <span className="breadcrumb-current">{product.name}</span>
      </nav>

      {/* PHẦN 1: TRƯNG BÀY SẢN PHẨM (THƯ VIỆN ẢNH + CẤU HÌNH) */}
      <section className="product-hero-grid">
        {/* TRÁI: THƯ VIỆN ẢNH TƯƠNG TÁC */}
        <div className="product-gallery-container">
          <div className="thumbnail-strip">
            {gallery.map((src, i) => (
              <div
                key={src + i}
                className={`thumb-item ${activeImage === src ? 'active' : ''}`}
                onClick={() => setActiveImage(src)}
                style={{ cursor: 'pointer' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${product.name} - góc ${i + 1}`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                  }}
                />
              </div>
            ))}
          </div>

          <div className="main-image-viewport">
            <span className="gallery-badge">Chính hãng • {product.collectionName || 'Bộ sưu tập Aethelgard'}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              id="main-product-img"
              src={activeImage || FALLBACK_IMAGE}
              alt={product.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
              }}
            />
            <button
              className="btn-zoom-preview"
              title="Xem ảnh lớn"
              onClick={() => setIsZoomOpen(true)}
              type="button"
            >
              🔍
            </button>
          </div>
        </div>

        {/* PHẢI: KHỐI MUA HÀNG & CHỌN PHÂN LOẠI */}
        <div className="product-config-panel">
          {/* THẺ THÔNG TIN GIAN HÀNG */}
          <div
            className="seller-mini-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#F8FAFC',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: '#0F172A',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '1rem',
                }}
              >
                {getInitials(brand || 'Aethelgard Mall')}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{brand ? `Cửa hàng chính hãng ${brand}` : 'Boutique Aethelgard'}</span>
                  <span
                    style={{
                      background: '#DC2626',
                      color: 'white',
                      fontSize: '0.68rem',
                      fontWeight: 900,
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    CHÍNH HÃNG
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                  {brandProductCount > 0 ? `${brandProductCount} sản phẩm trên sàn` : 'Gian hàng đối tác'} • Bảo đảm hàng chính hãng
                </div>
              </div>
            </div>
            <Link
              href={brand ? `/shop?brand=${encodeURIComponent(brand)}` : '/shop'}
              style={{
                padding: '8px 16px',
                background: '#FFFFFF',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-pill)',
                fontWeight: 700,
                fontSize: '0.82rem',
                color: 'var(--text-main)',
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
            >
              Xem Gian Hàng →
            </Link>
          </div>

          <span className="category-tag-pill">
            {product.categoryName || 'Thời Trang'} • {product.collectionName || 'Chính Hãng'}
          </span>
          <h1 className="product-detail-title">{product.name}</h1>

          {/* Điểm đánh giá & số lượt đánh giá */}
          <div className="product-rating-badge-row">
            <span className="stars-gold">{starText}</span>
            <span className="rating-score-text">{ratingScore}</span>
            <a href="#reviews-anchor" className="reviews-counter-link">
              ({product.reviewCount || 0} đánh giá từ khách hàng)
            </a>
          </div>

          {/* Pricing */}
          <div className="product-price-block">
            <span className="price-current">{formatVND(product.basePrice)}</span>
            {showOriginal && <span className="price-original">{formatVND(product.originalPrice!)}</span>}
            {discount > 0 && <span className="discount-badge-pill">-{discount}%</span>}
          </div>

          {/* Đếm ngược giao hàng nhanh */}
          <div className="delivery-countdown-box">
            <span>
              ⚡ Đặt hàng trong <span id="flash-timer" className="timer-val">{formatTimer()}</span> để được boutique xử lý & bàn giao vận chuyển ngay trong ngày!
            </span>
          </div>

          {/* Mô tả ngắn */}
          <p className="product-short-summary">{product.description}</p>

          {/* Chọn màu sắc */}
          {options.colors.length > 0 && (
            <div className="selector-group">
              <div className="selector-header">
                <span>
                  Màu sắc: <strong id="current-color-name">{activeColor || 'Chưa chọn'}</strong>
                </span>
              </div>
              <div className="color-swatches-list">
                {options.colors.map((c) => (
                  <button
                    key={c.value}
                    className={`color-swatch-btn ${activeColor === c.value ? 'active' : ''}`}
                    style={{ backgroundColor: colorToHex(c.value), opacity: c.stock > 0 ? 1 : 0.35 }}
                    onClick={() => setActiveColor(c.value)}
                    title={c.stock > 0 ? c.value : `${c.value} (hết hàng)`}
                    aria-label={`Màu ${c.value}`}
                    type="button"
                  ></button>
                ))}
              </div>
            </div>
          )}

          {/* Chọn kích cỡ */}
          {options.sizes.length > 0 && (
            <div className="selector-group" id="size-selector">
              <div className="selector-header">
                <span>
                  Chọn kích cỡ{activeSize ? `: ${activeSize}` : ''}
                  {needsSize && <em className="customer-required-hint"> (bắt buộc)</em>}
                </span>
                <span className="size-guide-link" onClick={() => setActiveTab('sizefit')} style={{ cursor: 'pointer' }}>
                  📏 Bảng kích cỡ (Size Guide)
                </span>
              </div>
              <div className="size-options-grid">
                {options.sizes.map((s) => {
                  const variant = findVariant(product.variants, s.value, activeColor || undefined);
                  const stock = variant ? variant.stockQuantity : s.stock;
                  return (
                    <button
                      key={s.value}
                      className={`size-btn ${activeSize === s.value ? 'active' : ''}`}
                      onClick={() => setActiveSize(s.value)}
                      disabled={stock <= 0}
                      title={stock <= 0 ? 'Hết hàng' : `Còn ${stock} sản phẩm`}
                      style={stock <= 0 ? { opacity: 0.4, textDecoration: 'line-through', cursor: 'not-allowed' } : undefined}
                      type="button"
                    >
                      {s.value}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tình trạng tồn kho */}
          <p className={`customer-stock-line ${isOutOfStock ? 'out' : availableStock <= 10 ? 'low' : ''}`}>
            {isOutOfStock
              ? 'Tạm hết hàng'
              : needsSize
                ? `Còn ${product.stockQuantity} sản phẩm (chọn size để xem tồn kho chính xác)`
                : availableStock <= 10
                  ? `Chỉ còn ${availableStock} sản phẩm — đặt ngay kẻo lỡ`
                  : `Còn hàng (${availableStock} sản phẩm)`}
          </p>

          {/* Nút thao tác (Thêm vào giỏ, chọn số lượng, Yêu thích) */}
          <div className="action-buttons-stack">
            <div className="qty-stepper">
              <button
                id="btn-qty-minus"
                className="qty-step-btn"
                onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                aria-label="Giảm số lượng"
                type="button"
              >
                -
              </button>
              <span id="qty-display" className="qty-display-val">{qty}</span>
              <button
                id="btn-qty-plus"
                className="qty-step-btn"
                onClick={() => {
                  if (availableStock > 0 && qty >= availableStock) {
                    showToast(`Chỉ còn ${availableStock} sản phẩm trong kho`);
                    return;
                  }
                  setQty((prev) => prev + 1);
                }}
                aria-label="Tăng số lượng"
                type="button"
              >
                +
              </button>
            </div>

            <button
              id="btn-add-cart"
              className="btn-add-to-cart-primary"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              style={isOutOfStock ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span>{isOutOfStock ? 'Tạm Hết Hàng' : 'Thêm Vào Giỏ Hàng'}</span>
            </button>

            <button
              id="btn-wishlist"
              className={`btn-wishlist-toggle ${isWishlist ? 'active' : ''}`}
              title={isWishlist ? 'Bỏ khỏi danh sách yêu thích' : 'Thêm vào danh sách yêu thích'}
              onClick={handleWishlistToggle}
              type="button"
            >
              {isWishlist ? '♥' : '♡'}
            </button>
          </div>

          <button
            id="btn-buy-now"
            className="btn-buy-now-accent"
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            style={isOutOfStock ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            type="button"
          >
            Mua Ngay Với 1 Bước
          </button>

          {/* Huy hiệu cam kết */}
          <div className="trust-badges-grid">
            <div className="trust-item">
              <div className="trust-icon-title">
                <span>🚚</span>
                <span>Giao Hàng Miễn Phí</span>
              </div>
              <span className="trust-subtext">Đơn hàng trên {formatVND(FREE_SHIPPING_THRESHOLD)} toàn quốc</span>
            </div>
            <div className="trust-item">
              <div className="trust-icon-title">
                <span>🔄</span>
                <span>Đổi Trả Dễ Dàng</span>
              </div>
              <span className="trust-subtext">30 ngày đổi size miễn phí tận nơi</span>
            </div>
            <div className="trust-item">
              <div className="trust-icon-title">
                <span>🛡</span>
                <span>Chính Hãng 100%</span>
              </div>
              <span className="trust-subtext">Cam kết 100% hàng chính hãng</span>
            </div>
          </div>
        </div>
      </section>

      {/* PHẦN 2: THÔNG SỐ SẢN PHẨM & CÁC TAB */}
      <section className="product-tabs-section">
        <div className="tabs-nav-bar">
          <button className={`tab-nav-btn ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')} type="button">
            Chi Tiết Sản Phẩm
          </button>
          <button className={`tab-nav-btn ${activeTab === 'materials' ? 'active' : ''}`} onClick={() => setActiveTab('materials')} type="button">
            Chất Liệu & Bảo Quản
          </button>
          <button className={`tab-nav-btn ${activeTab === 'sizefit' ? 'active' : ''}`} onClick={() => setActiveTab('sizefit')} type="button">
            Thông Số Form Dáng
          </button>
          <button className={`tab-nav-btn ${activeTab === 'shipping' ? 'active' : ''}`} onClick={() => setActiveTab('shipping')} type="button">
            Vận Chuyển & Bảo Hành
          </button>
        </div>

        {/* TAB 1: DETAILS */}
        {activeTab === 'details' && (
          <div id="tab-details" className="tab-pane-content active">
            <div className="tab-split-grid">
              <div>
                <p className="tab-text-lead">{product.description}</p>
                <ul className="tab-feature-bullets">
                  {brand && (
                    <li>
                      <span className="bullet-icon">✓</span>
                      <span><strong>Thương hiệu:</strong> {brand}</span>
                    </li>
                  )}
                  {product.collectionName && (
                    <li>
                      <span className="bullet-icon">✓</span>
                      <span><strong>Bộ sưu tập:</strong> {product.collectionName}</span>
                    </li>
                  )}
                  <li>
                    <span className="bullet-icon">✓</span>
                    <span><strong>Danh mục:</strong> {product.categoryName || 'Thời trang cao cấp'}</span>
                  </li>
                  {product.countryOfOrigin && (
                    <li>
                      <span className="bullet-icon">✓</span>
                      <span><strong>Xuất xứ:</strong> {product.countryOfOrigin}</span>
                    </li>
                  )}
                  <li>
                    <span className="bullet-icon">✓</span>
                    <span><strong>Mã sản phẩm (SKU):</strong> {selectedVariant?.sku || product.sku}</span>
                  </li>
                </ul>
              </div>
              <div className="tab-visual-banner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={gallery[1] || gallery[0]}
                  alt={`Chi tiết ${product.name}`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                  }}
                />
                <div className="tab-visual-overlay">
                  <h4>TAY NGHỀ CHẾ TÁC {(brand || 'Aethelgard').toUpperCase()}</h4>
                  <p>{product.collectionName || 'Phân phối chính hãng tại Aethelgard Mall'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MATERIALS */}
        {activeTab === 'materials' && (
          <div id="tab-materials" className="tab-pane-content active">
            <p className="tab-text-lead">
              <strong>Thành phần / Chất liệu:</strong> {product.material || 'Đang cập nhật từ thương hiệu'}
              <br />
              <strong>Hướng dẫn bảo quản:</strong>
            </p>
            <ul className="tab-feature-bullets">
              {product.careInstructions ? (
                product.careInstructions
                  .split(/[.;\n]/)
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line) => (
                    <li key={line}>
                      <span className="bullet-icon">✓</span> {line}
                    </li>
                  ))
              ) : (
                <>
                  <li><span className="bullet-icon">✓</span> Bảo quản nơi khô ráo, tránh ánh nắng trực tiếp và độ ẩm cao.</li>
                  <li><span className="bullet-icon">✓</span> Vệ sinh theo hướng dẫn trên nhãn mác của thương hiệu.</li>
                  <li><span className="bullet-icon">✓</span> Cất trong túi chống bụi đi kèm khi không sử dụng.</li>
                </>
              )}
            </ul>
          </div>
        )}

        {/* TAB 3: KÍCH CỠ & FORM DÁNG */}
        {activeTab === 'sizefit' && (
          <div id="tab-sizefit" className="tab-pane-content active">
            {footwear ? (
              <>
                <p className="tab-text-lead">Quy đổi size giày theo chiều dài bàn chân:</p>
                <ul className="tab-feature-bullets">
                  <li><span className="bullet-icon">✓</span> <strong>EU 38–39:</strong> Chiều dài chân 24.0 – 24.8 cm</li>
                  <li><span className="bullet-icon">✓</span> <strong>EU 40–41:</strong> Chiều dài chân 25.0 – 26.0 cm</li>
                  <li><span className="bullet-icon">✓</span> <strong>EU 42–43:</strong> Chiều dài chân 26.5 – 27.5 cm</li>
                  <li><span className="bullet-icon">✓</span> <strong>EU 44–45:</strong> Chiều dài chân 28.0 – 29.0 cm</li>
                </ul>
              </>
            ) : (
              <>
                <p className="tab-text-lead">Gợi ý chọn size dựa theo chiều cao và cân nặng chuẩn:</p>
                <ul className="tab-feature-bullets">
                  <li><span className="bullet-icon">✓</span> <strong>Size S:</strong> Chiều cao 1m55 - 1m65 | Cân nặng 48kg - 58kg</li>
                  <li><span className="bullet-icon">✓</span> <strong>Size M:</strong> Chiều cao 1m65 - 1m75 | Cân nặng 58kg - 70kg</li>
                  <li><span className="bullet-icon">✓</span> <strong>Size L:</strong> Chiều cao 1m72 - 1m80 | Cân nặng 70kg - 82kg</li>
                  <li><span className="bullet-icon">✓</span> <strong>Size XL/XXL:</strong> Chiều cao trên 1m80 | Cân nặng 82kg - 100kg</li>
                </ul>
              </>
            )}
            {options.sizes.length > 0 && (
              <p className="tab-text-lead" style={{ marginTop: 12 }}>
                <strong>Size đang có hàng:</strong>{' '}
                {options.sizes.filter((s) => s.stock > 0).map((s) => s.value).join(', ') || 'Tạm hết'}
              </p>
            )}
          </div>
        )}

        {/* TAB 4: SHIPPING */}
        {activeTab === 'shipping' && (
          <div id="tab-shipping" className="tab-pane-content active">
            <p className="tab-text-lead">Chính sách vận chuyển & đổi trả minh bạch tại Aethelgard Mall:</p>
            <ul className="tab-feature-bullets">
              <li><span className="bullet-icon">✓</span> <strong>Phí vận chuyển:</strong> Miễn phí cho đơn trên {formatVND(FREE_SHIPPING_THRESHOLD)}, các đơn khác đồng giá 50.000 đ.</li>
              <li><span className="bullet-icon">✓</span> <strong>Thời gian giao:</strong> Dự kiến 3 ngày làm việc, theo dõi hành trình trong mục Đơn Hàng Của Tôi.</li>
              <li><span className="bullet-icon">✓</span> <strong>Đồng kiểm khi nhận hàng:</strong> Bạn được kiểm tra hàng trước khi thanh toán (COD).</li>
              <li><span className="bullet-icon">✓</span> <strong>Đổi hàng miễn phí:</strong> Hỗ trợ đổi size tận nhà trong vòng 30 ngày.</li>
              <li><span className="bullet-icon">✓</span> <strong>Hóa đơn:</strong> Giá đã niêm yết chưa gồm thuế VAT 8% (hiển thị rõ khi thanh toán).</li>
            </ul>
          </div>
        )}
      </section>

      {/* PHẦN 2.5: TRỢ LÝ PHỐI ĐỒ AI */}
      <AIStylistPanel product={product} catalog={catalog} />

      {/* SECTION 3: REVIEWS & RATINGS */}
      <section className="reviews-section-wrapper" id="reviews-anchor">
        <h2 className="reviews-section-header">Đánh Giá & Nhận Xét Từ Khách Hàng</h2>
        <div className="reviews-breakdown-grid">
          {/* Thẻ điểm tổng quan */}
          <div className="overall-score-card">
            <div className="big-rating-number">
              {ratingScore}
              <span> / 5</span>
            </div>
            <div className="stars-gold">{starText}</div>
            <div className="review-verified-tag">Dựa trên {product.reviewCount || 0} lượt đánh giá mua hàng thực tế</div>

            {/* Form viết đánh giá */}
            <form className="customer-review-form" onSubmit={submitReview}>
              <label className="customer-form-label">Viết đánh giá của bạn</label>
              <div className="customer-star-input" role="radiogroup" aria-label="Chọn số sao">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={reviewRating === n}
                    className={n <= reviewRating ? 'on' : ''}
                    onClick={() => setReviewRating(n)}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Chất liệu, form dáng, đóng gói... (tối thiểu 10 ký tự)"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
              <button type="submit" className="customer-ai-submit">
                Gửi đánh giá
              </button>
            </form>
          </div>

          {/* Danh sách nhận xét của khách */}
          <div className="customer-reviews-feed">
            {reviews.length === 0 ? (
              <div className="review-testimonial-card customer-review-empty">
                <p className="review-comment-text">
                  Chưa có nhận xét chi tiết nào cho sản phẩm này. Hãy là người đầu tiên chia sẻ trải nghiệm của bạn!
                </p>
              </div>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="review-testimonial-card">
                  <div className="reviewer-meta-row">
                    <div className="reviewer-info">
                      <div className="reviewer-avatar">{getInitials(r.author)}</div>
                      <div>
                        <div className="reviewer-name">{r.author}</div>
                        <span className="verified-badge">✓ Đánh giá của bạn (lưu trên thiết bị này)</span>
                      </div>
                    </div>
                    <span className="review-date">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="stars-gold" style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
                    {'★★★★★'.slice(0, r.rating)}
                    {'☆☆☆☆☆'.slice(0, 5 - r.rating)}
                  </div>
                  <p className="review-comment-text">&quot;{r.comment}&quot;</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* PHẦN 4: SẢN PHẨM TƯƠNG TỰ */}
      {related.length > 0 && (
        <section className="related-products-section">
          <div className="related-section-header">
            <h2>Sản Phẩm Tương Tự</h2>
            <Link href={`/shop?category=${product.categoryId}`} className="view-all-link">
              <span>Xem tất cả {product.categoryName || 'sản phẩm'}</span>
              <span>→</span>
            </Link>
          </div>

          <div className="related-grid">
            {related.map((p) => {
              const liked = isInWishlist(p.id);
              return (
                <Link key={p.id} href={`/product-detail/${p.id}`} className="related-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="related-img-box">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.imageUrl || FALLBACK_IMAGE}
                      alt={p.name}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                      }}
                    />
                    <button
                      className="btn-card-wishlist"
                      title={liked ? 'Bỏ yêu thích' : 'Yêu thích'}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const added = toggleWishlist(p);
                        showToast(added ? 'Đã thêm vào danh sách yêu thích' : 'Đã gỡ khỏi danh sách yêu thích');
                      }}
                    >
                      {liked ? '♥' : '♡'}
                    </button>
                  </div>
                  <div className="related-info">
                    <div className="related-title">{p.name}</div>
                    <div className="related-price-row">
                      <span className="related-price">{formatVND(p.basePrice)}</span>
                      <span className="stars-gold" style={{ fontSize: '0.82rem' }}>★ {(p.rating || 0).toFixed(1)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Lightbox xem ảnh lớn */}
      <Modal isOpen={isZoomOpen} onClose={() => setIsZoomOpen(false)} size="xl" title={product.name}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={activeImage || FALLBACK_IMAGE} alt={product.name} className="customer-zoom-img" />
        <div className="customer-zoom-thumbs">
          {gallery.map((src, i) => (
            <button
              key={src + i}
              type="button"
              className={activeImage === src ? 'active' : ''}
              onClick={() => setActiveImage(src)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Ảnh ${i + 1}`} />
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
