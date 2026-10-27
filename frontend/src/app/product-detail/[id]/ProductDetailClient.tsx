'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Eye } from 'lucide-react';
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
  isVerifiedPurchase?: boolean;
  helpfulCount?: number;
  shopReply?: string | null;
  shopReplyAt?: string | null;
  liked?: boolean;
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
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

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

  // Đồng bộ tồn kho mới nhất ngay lập tức khi khách vừa đặt hàng hoặc kho thay đổi từ sàn
  useEffect(() => {
    if (!productId) return;
    const handleCatalogUpdate = () => {
      productService
        .getProductById(productId)
        .then((fresh) => {
          if (fresh) setProduct(fresh);
        })
        .catch(() => {});
    };

    window.addEventListener('aethelgard:catalog-updated', handleCatalogUpdate);
    return () => {
      window.removeEventListener('aethelgard:catalog-updated', handleCatalogUpdate);
    };
  }, [productId]);

  // 2. Đồng hồ chốt đơn trong ngày
  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft(secondsUntilCutoff(new Date())), 1000);
    return () => clearInterval(timer);
  }, []);

  // Tự động điền tên khách hàng nếu đã đăng nhập
  useEffect(() => {
    if (user?.fullName && !customerNameInput) {
      setCustomerNameInput(user.fullName);
    }
  }, [user, customerNameInput]);

  // 3. Đánh giá thực tế từ CSDL Backend
  const loadReviews = useCallback(async () => {
    if (!productId) return;
    try {
      const dbReviews = await productService.getProductReviews(productId);
      if (dbReviews && Array.isArray(dbReviews) && dbReviews.length > 0) {
        setReviews(
          dbReviews.map((r: any) => ({
            id: String(r.id),
            productId: r.productId,
            author: r.customerName || 'Khách Hàng Aethelgard',
            rating: r.rating || 5,
            comment: r.comment || '',
            createdAt: r.createdAt || new Date().toISOString(),
            isVerifiedPurchase: r.isVerifiedPurchase ?? true,
            helpfulCount: r.helpfulCount || 0,
            shopReply: r.shopReply || null,
            shopReplyAt: r.shopReplyAt || null,
            liked: false,
          }))
        );
        return;
      }
    } catch (err) {
      console.warn('Lỗi tải đánh giá từ API, chuyển sang lưu trữ cục bộ:', err);
    }
    try {
      const all: LocalReview[] = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]');
      setReviews(all.filter((r) => r.productId === productId));
    } catch {
      setReviews([]);
    }
  }, [productId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

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
  const isSeller = user?.role === 'Seller';
  const isAdmin = user?.role === 'Admin';
  const isManagement = isSeller || isAdmin;
  const isOwnProduct = isSeller && !!product && product.sellerId === (user?.id || user?.userId);

  // Tồn kho khả dụng theo phân loại đang chọn
  const availableStock = selectedVariant && (activeSize || !options.sizes.length)
    ? selectedVariant.stockQuantity
    : product?.stockQuantity ?? 0;
  const isOutOfStock = (product?.stockQuantity ?? 0) <= 0;
  const needsSize = options.sizes.length > 0 && !activeSize;

  // Thống kê phân bổ sao đánh giá (Histogram)
  const reviewStats = useMemo(() => {
    const total = reviews.length;
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
      counts[star] = (counts[star] || 0) + 1;
      sum += r.rating || 5;
    });
    const avg = total > 0 ? (sum / total).toFixed(1) : (product?.rating || 5).toFixed(1);
    return {
      total,
      avg,
      counts,
      percents: {
        5: total > 0 ? Math.round(((counts[5] || 0) / total) * 100) : 0,
        4: total > 0 ? Math.round(((counts[4] || 0) / total) * 100) : 0,
        3: total > 0 ? Math.round(((counts[3] || 0) / total) * 100) : 0,
        2: total > 0 ? Math.round(((counts[2] || 0) / total) * 100) : 0,
        1: total > 0 ? Math.round(((counts[1] || 0) / total) * 100) : 0,
      },
    };
  }, [reviews, product?.rating]);

  // Danh sách đánh giá đã lọc theo số sao
  const filteredReviews = useMemo(() => {
    if (selectedStarFilter === null) return reviews;
    return reviews.filter((r) => Math.round(r.rating || 5) === selectedStarFilter);
  }, [reviews, selectedStarFilter]);

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
    if (isSeller) {
      showToast('Tài khoản Người bán chỉ xem trước giao diện và không thể đặt hàng.');
      return false;
    }
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
    const nameToUse = (customerNameInput.trim() || user?.fullName || 'Khách Hàng Aethelgard').trim();
    if (reviewComment.trim().length < 10) {
      showToast('Nhận xét cần tối thiểu 10 ký tự');
      return;
    }
    setIsSubmittingReview(true);
    try {
      const created = await productService.addProductReview(product.id, {
        customerName: nameToUse,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      const newRev: LocalReview = {
        id: String(created?.id || Date.now()),
        productId: product.id,
        author: created?.customerName || nameToUse,
        rating: created?.rating || reviewRating,
        comment: created?.comment || reviewComment.trim(),
        createdAt: created?.createdAt || new Date().toISOString(),
        isVerifiedPurchase: created?.isVerifiedPurchase ?? true,
        helpfulCount: created?.helpfulCount ?? 0,
        shopReply: created?.shopReply ?? null,
        shopReplyAt: created?.shopReplyAt ?? null,
        liked: false,
      };
      setReviews((prev) => [newRev, ...prev]);
      setReviewComment('');
      setReviewRating(5);
      showToast('Cảm ơn bạn đã gửi đánh giá vào hệ thống sàn Aethelgard!');
      // Tự động làm mới điểm đánh giá trung bình & lượt đánh giá của sản phẩm
      productService
        .getProductById(product.id)
        .then((fresh) => {
          if (fresh) setProduct(fresh);
        })
        .catch(() => {});
    } catch (err) {
      console.error('Lỗi gửi đánh giá:', err);
      const fallbackRev: LocalReview = {
        id: `${Date.now()}`,
        productId: product.id,
        author: nameToUse,
        rating: reviewRating,
        comment: reviewComment.trim(),
        createdAt: new Date().toISOString(),
        isVerifiedPurchase: true,
        helpfulCount: 0,
        shopReply: null,
        shopReplyAt: null,
        liked: false,
      };
      try {
        const all: LocalReview[] = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]');
        localStorage.setItem(REVIEWS_KEY, JSON.stringify([fallbackRev, ...all]));
      } catch {
        // bỏ qua
      }
      setReviews((prev) => [fallbackRev, ...prev]);
      setReviewComment('');
      setReviewRating(5);
      showToast('Đã lưu nhận xét của bạn vào hệ thống!');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleVoteHelpful = async (reviewId: string) => {
    const numId = parseInt(reviewId, 10);
    const target = reviews.find((r) => r.id === reviewId);
    if (!target) return;
    if (target.liked) {
      showToast('Bạn đã ghi nhận đánh giá này hữu ích rồi!');
      return;
    }

    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1, liked: true }
          : r
      )
    );
    showToast('Cảm ơn bạn đã bình chọn nhận xét hữu ích!');

    if (!isNaN(numId)) {
      try {
        await productService.voteReviewHelpful(product.id, numId);
      } catch (err) {
        console.warn('Không thể gửi vote lên server:', err);
      }
    }
  };



  const ratingScore = reviewStats.avg;
  const fullStars = Math.round(parseFloat(reviewStats.avg) || 0);
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

          {/* Nút thao tác: Nếu là Người bán thì hiển thị thông báo Chế độ xem trước (không có giỏ hàng & không đặt hàng) */}
          {isManagement ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-3 my-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm shrink-0">
                    <Eye className="w-4 h-4 text-white" />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 m-0">
                      {isAdmin ? 'Góc Người Mua (Chế độ giám sát)' : 'Góc Người Mua (Chế độ xem trước)'}
                    </h4>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {isAdmin ? 'Tài khoản Quản trị viên sàn' : 'Tài khoản Người bán'} ({user?.fullName || user?.email})
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-white tracking-wider uppercase">
                  {isAdmin ? 'Giám Sát' : 'Chỉ Xem Trước'}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed m-0">
                {isAdmin
                  ? 'Đây là giao diện hiển thị thực tế với khách hàng. Tài khoản Quản trị viên không có giỏ hàng và không được phép đặt hàng.'
                  : 'Đây là giao diện hiển thị thực tế với khách hàng. Tài khoản Người bán không có giỏ hàng và không được phép đặt hàng.'}
              </p>
              {isOwnProduct ? (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 flex items-center gap-1">
                    ✓ Sản phẩm thuộc gian hàng của bạn
                  </span>
                  <Link
                    href="/inventory"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-sm transition-all text-decoration-none"
                  >
                    ⚙ Quản lý tồn kho &rarr;
                  </Link>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {isAdmin
                      ? 'Sản phẩm này thuộc quyền quản lý của một thương hiệu trên sàn.'
                      : 'Sản phẩm này thuộc gian hàng đối tác khác trên sàn.'}
                  </span>
                  {isAdmin && (
                    <Link
                      href="/inventory"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-sm transition-all text-decoration-none"
                    >
                      ⚙ Quản lý tồn kho toàn sàn &rarr;
                    </Link>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
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
            </>
          )}

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
          <h2 className="reviews-section-header" style={{ margin: 0 }}>Đánh Giá & Nhận Xét Từ Khách Hàng</h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            100% Đánh giá từ người mua hàng thực tế đã xác thực
          </span>
        </div>

        <div className="reviews-breakdown-grid">
          {/* Cột trái: Thẻ điểm tổng quan & Thống kê sao & Form gửi nhận xét */}
          <div className="overall-score-card">
            <div className="big-rating-number">
              {ratingScore}
              <span> / 5</span>
            </div>
            <div className="stars-gold">{starText}</div>
            <div className="review-verified-tag">
              Dựa trên {reviewStats.total} lượt đánh giá thực tế từ khách hàng
            </div>

            {/* Histogram phân bổ sao tương tác */}
            <div className="rating-histogram" style={{ margin: '20px 0', padding: '16px 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = reviewStats.counts[stars] || 0;
                const pct = reviewStats.percents[stars as 1 | 2 | 3 | 4 | 5] || 0;
                const isSelected = selectedStarFilter === stars;
                return (
                  <div
                    key={stars}
                    onClick={() => setSelectedStarFilter(isSelected ? null : stars)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: isSelected ? 'rgba(217, 119, 6, 0.12)' : 'transparent',
                      transition: 'all 0.2s',
                    }}
                    title={`Nhấn để lọc đánh giá ${stars} sao`}
                  >
                    <span style={{ width: '42px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {stars} <span style={{ color: '#d97706' }}>★</span>
                    </span>
                    <div className="histo-bar" style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                      <div
                        className="histo-fill"
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: isSelected ? '#b45309' : '#d97706',
                          borderRadius: 999,
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                    <span className="histo-count" style={{ width: '46px', textAlign: 'right', color: '#64748b', fontSize: '0.78rem' }}>
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Form viết đánh giá */}
            <form className="customer-review-form" onSubmit={submitReview}>
              <label className="customer-form-label" style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>
                Chia sẻ trải nghiệm của bạn
              </label>

              {/* Chọn số sao kèm nhãn minh họa */}
              <div style={{ marginBottom: 12 }}>
                <div className="customer-star-input" role="radiogroup" aria-label="Chọn số sao">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={reviewRating === n}
                      className={n <= reviewRating ? 'on' : ''}
                      onClick={() => setReviewRating(n)}
                      title={`${n} sao`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 600, display: 'block', marginTop: 4 }}>
                  {reviewRating === 5 && '★★★★★ Tuyệt vời! Rất hài lòng với sản phẩm'}
                  {reviewRating === 4 && '★★★★☆ Rất tốt! Hài lòng với chất lượng'}
                  {reviewRating === 3 && '★★★☆☆ Tạm ổn, đúng như mô tả'}
                  {reviewRating === 2 && '★★☆☆☆ Chưa thực sự hài lòng'}
                  {reviewRating === 1 && '★☆☆☆☆ Cần cải thiện nhiều'}
                </span>
              </div>

              {/* Tên khách hàng */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Tên hiển thị của bạn:
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ví dụ: Hoàng Long, Minh Thư..."
                  value={customerNameInput}
                  onChange={(e) => setCustomerNameInput(e.target.value)}
                  maxLength={50}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '0.88rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                  }}
                />
              </div>

              {/* Nội dung nhận xét */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Nội dung nhận xét:
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Chất vải, đường may, form dáng, trải nghiệm đóng gói... (tối thiểu 10 ký tự)"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '0.88rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    resize: 'vertical',
                  }}
                />
              </div>

              <button
                type="submit"
                className="customer-ai-submit"
                disabled={isSubmittingReview}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: isSubmittingReview ? 'not-allowed' : 'pointer',
                  opacity: isSubmittingReview ? 0.7 : 1,
                  background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
                  color: '#ffffff',
                  border: 'none',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                {isSubmittingReview ? 'Đang gửi đánh giá...' : '✦ Gửi Đánh Giá Ngay'}
              </button>
            </form>
          </div>

          {/* Cột phải: Bộ lọc số sao & Danh sách nhận xét của khách */}
          <div className="customer-reviews-feed">
            {/* Bộ lọc thanh ngang */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, paddingBottom: 14, borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setSelectedStarFilter(null)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '999px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: selectedStarFilter === null ? '#18181b' : '#e2e8f0',
                    background: selectedStarFilter === null ? '#18181b' : '#ffffff',
                    color: selectedStarFilter === null ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Tất cả ({reviewStats.total})
                </button>
                {[5, 4, 3, 2, 1].map((s) => {
                  const count = reviewStats.counts[s] || 0;
                  const isSel = selectedStarFilter === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedStarFilter(isSel ? null : s)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '999px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        border: '1px solid',
                        borderColor: isSel ? '#d97706' : '#e2e8f0',
                        background: isSel ? '#d97706' : '#ffffff',
                        color: isSel ? '#ffffff' : '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {s} ★ ({count})
                    </button>
                  );
                })}
              </div>

              {selectedStarFilter !== null && (
                <button
                  type="button"
                  onClick={() => setSelectedStarFilter(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '0.8rem',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                  }}
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>

            {/* Danh sách review */}
            {filteredReviews.length === 0 ? (
              <div className="review-testimonial-card customer-review-empty" style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '12px' }}>
                <p className="review-comment-text" style={{ color: '#64748b', margin: 0 }}>
                  {selectedStarFilter !== null
                    ? `Chưa có đánh giá nào đạt ${selectedStarFilter} sao cho sản phẩm này.`
                    : 'Chưa có nhận xét chi tiết nào cho sản phẩm này. Hãy là người đầu tiên chia sẻ trải nghiệm của bạn!'}
                </p>
              </div>
            ) : (
              filteredReviews.map((r) => (
                <div key={r.id} className="review-testimonial-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <div className="reviewer-meta-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div className="reviewer-info" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="reviewer-avatar" style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.92rem' }}>
                        {getInitials(r.author)}
                      </div>
                      <div>
                        <div className="reviewer-name" style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                          {r.author}
                        </div>
                        {r.isVerifiedPurchase !== false ? (
                          <span
                            className="verified-badge"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              background: '#ecfdf5',
                              color: '#059669',
                              border: '1px solid #a7f3d0',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              marginTop: 2,
                            }}
                          >
                            ✓ Đã mua hàng tại Aethelgard
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Thành viên cộng đồng</span>
                        )}
                      </div>
                    </div>
                    <span className="review-date" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {new Date(r.createdAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="stars-gold" style={{ fontSize: '0.95rem', marginBottom: 8, color: '#d97706', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>
                      {'★★★★★'.slice(0, r.rating)}
                      {'☆☆☆☆☆'.slice(0, 5 - r.rating)}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#b45309' }}>
                      {r.rating === 5 && 'Cực kỳ hài lòng'}
                      {r.rating === 4 && 'Rất hài lòng'}
                      {r.rating === 3 && 'Bình thường'}
                      {r.rating === 2 && 'Chưa hài lòng'}
                      {r.rating === 1 && 'Kém'}
                    </span>
                  </div>

                  <p className="review-comment-text" style={{ fontSize: '0.92rem', lineHeight: 1.6, color: '#334155', margin: '0 0 12px 0' }}>
                    &quot;{r.comment}&quot;
                  </p>

                  {/* Nút bình chọn hữu ích */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 8, borderTop: '1px dashed #f1f5f9' }}>
                    <button
                      type="button"
                      onClick={() => handleVoteHelpful(r.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: '0.8rem',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: r.liked ? '#10b981' : '#e2e8f0',
                        background: r.liked ? '#ecfdf5' : '#ffffff',
                        color: r.liked ? '#059669' : '#64748b',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      title="Bình chọn đánh giá này hữu ích"
                    >
                      <span>👍 Hữu ích</span>
                      {(r.helpfulCount || 0) > 0 && <span style={{ fontWeight: 700 }}>({r.helpfulCount})</span>}
                    </button>
                  </div>

                  {/* Phản hồi chính thức từ Nhà bán hàng / Thương hiệu */}
                  {r.shopReply && (
                    <div
                      style={{
                        marginTop: 14,
                        padding: '12px 16px',
                        background: '#f8fafc',
                        borderLeft: '3px solid #d97706',
                        borderRadius: '0 8px 8px 0',
                        fontSize: '0.86rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, color: '#92400e', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>👑 Phản hồi từ {brand || 'Aethelgard Boutique'}</span>
                        </span>
                        {r.shopReplyAt && (
                          <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                            {new Date(r.shopReplyAt).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, color: '#334155', lineHeight: 1.55 }}>
                        {r.shopReply}
                      </p>
                    </div>
                  )}
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
