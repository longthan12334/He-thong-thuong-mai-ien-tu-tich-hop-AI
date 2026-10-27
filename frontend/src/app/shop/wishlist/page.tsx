'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Product } from '@/types';
import { useShopper } from '@/contexts/ShopperContext';
import { useCatalog } from '@/hooks/useCatalog';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/useToast';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CustomerProductCard, ShopSubnav } from '@/components/customer';
import { formatVND } from '@/lib/utils';
import { FALLBACK_IMAGE } from '@/lib/constants';
import { recommendProducts } from '@/lib/customer';
import { ShoppingBag, Trash2 } from 'lucide-react';

export default function WishlistPage() {
  const router = useRouter();
  const { wishlist, removeFromWishlist, recentlyViewed } = useShopper();
  const { products, isLoading } = useCatalog();
  const { addToCart, setIsCartOpen } = useCart();
  const { showToast } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();

  // Ghép với dữ liệu mới nhất từ sàn để giá / tồn kho luôn chính xác
  const items = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    return wishlist.map((w) => ({ saved: w, live: byId.get(w.id) as Product | undefined }));
  }, [wishlist, products]);

  const suggestions = useMemo(
    () => recommendProducts(products, { viewed: recentlyViewed, wishlist }, 4),
    [products, recentlyViewed, wishlist]
  );

  const handleAdd = (live: Product | undefined, id: number) => {
    if (!live) {
      router.push(`/product-detail/${id}`);
      return;
    }
    if ((live.variants?.length || 0) > 0) {
      showToast('Vui lòng chọn size / màu trước khi thêm vào giỏ');
      router.push(`/product-detail/${id}`);
      return;
    }
    if ((live.stockQuantity ?? 0) <= 0) {
      showToast('Sản phẩm tạm hết hàng');
      return;
    }
    addToCart(live, 1, 'Tiêu chuẩn');
    showToast(`Đã thêm ${live.name} vào giỏ hàng`);
    setIsCartOpen(true);
  };

  const handleAddAllToCart = () => {
    let addedCount = 0;
    items.forEach(({ live }) => {
      if (live && (live.stockQuantity ?? 0) > 0 && (!live.variants || live.variants.length === 0)) {
        addToCart(live, 1, 'Tiêu chuẩn');
        addedCount++;
      }
    });

    if (addedCount > 0) {
      showToast(`Đã thêm ${addedCount} sản phẩm sẵn sàng vào giỏ hàng!`);
      setIsCartOpen(true);
    } else {
      showToast('Các sản phẩm yêu cầu chọn size / màu cụ thể trước khi thêm.');
    }
  };

  const handleClearAll = async () => {
    const ok = await confirm({
      title: 'Xóa Danh Sách Yêu Thích',
      message: 'Bạn có chắc chắn muốn xóa toàn bộ sản phẩm khỏi danh sách yêu thích?',
      confirmText: 'Xóa Tất Cả',
      cancelText: 'Giữ Lại',
      tone: 'danger',
    });

    if (!ok) return;

    wishlist.forEach((w) => removeFromWishlist(w.id));
    showToast('Đã xóa toàn bộ danh sách yêu thích.');
  };

  return (
    <div className="customer-page">
      <div className="customer-page-head">
        <div>
          <h1 className="customer-page-title">Danh Sách Yêu Thích</h1>
          <p className="customer-page-sub">
            {wishlist.length > 0
              ? `${wishlist.length} sản phẩm bạn đã lưu — giá và tồn kho được cập nhật theo thời gian thực.`
              : 'Thả tim ♡ trên sản phẩm bất kỳ để lưu lại và nhận gợi ý cá nhân hóa.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {wishlist.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleAddAllToCart}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Thêm Tất Cả Vào Giỏ</span>
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-500 text-xs font-semibold shadow-xs transition-all cursor-pointer"
                title="Xóa toàn bộ"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <ShopSubnav />
        </div>
      </div>

      {wishlist.length === 0 ? (
        <div className="customer-empty-state">
          <p>Danh sách yêu thích đang trống.</p>
          <Link href="/shop" className="customer-link-btn">
            Khám phá sản phẩm →
          </Link>
        </div>
      ) : (
        <div className="customer-wishlist-list">
          {items.map(({ saved, live }) => {
            const price = live?.basePrice ?? saved.basePrice;
            const priceDropped = live && live.basePrice < saved.basePrice;
            const outOfStock = live ? (live.stockQuantity ?? 0) <= 0 : false;
            return (
              <div key={saved.id} className="customer-wishlist-row">
                <Link href={`/product-detail/${saved.id}`} className="customer-wishlist-thumb">
                  <img
                    src={(live?.imageUrl || saved.imageUrl) || FALLBACK_IMAGE}
                    alt={saved.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                    }}
                  />
                </Link>
                <div className="customer-wishlist-info">
                  <span className="category-tag-top">{saved.categoryName || 'Thời Trang'}</span>
                  <Link href={`/product-detail/${saved.id}`} className="customer-wishlist-name">
                    {saved.name}
                  </Link>
                  <div className="customer-wishlist-meta">
                    <strong>{formatVND(price)}</strong>
                    {priceDropped && (
                      <span className="customer-price-drop">↓ Giảm {formatVND(saved.basePrice - live!.basePrice)} kể từ khi bạn lưu</span>
                    )}
                    {!isLoading && !live && <span className="customer-muted">Sản phẩm không còn niêm yết</span>}
                    {outOfStock && <span className="customer-muted">Tạm hết hàng</span>}
                  </div>
                </div>
                <div className="customer-wishlist-actions">
                  <button
                    type="button"
                    className="customer-ai-submit"
                    onClick={() => handleAdd(live, saved.id)}
                    disabled={outOfStock}
                  >
                    {live && (live.variants?.length || 0) > 0 ? 'Chọn phân loại' : 'Thêm vào giỏ'}
                  </button>
                  <button
                    type="button"
                    className="customer-text-btn"
                    onClick={() => {
                      removeFromWishlist(saved.id);
                      showToast('Đã gỡ khỏi danh sách yêu thích');
                    }}
                  >
                    Gỡ bỏ
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && suggestions.length > 0 && (
        <section className="customer-page-section">
          <div className="section-header">
            <h2>Có Thể Bạn Cũng Thích</h2>
          </div>
          <div className="recommendations-grid">
            {suggestions.map(({ product, reason }) => (
              <CustomerProductCard key={product.id} product={product} reason={wishlist.length ? reason : undefined} />
            ))}
          </div>
        </section>
      )}

      {confirmDialog}
    </div>
  );
}
