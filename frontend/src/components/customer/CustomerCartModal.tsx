'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/useToast';
import { formatVND } from '@/lib/utils';
import { FALLBACK_IMAGE } from '@/lib/constants';
import { calcOrderTotals, FREE_SHIPPING_THRESHOLD } from '@/lib/customer';

/**
 * Giỏ hàng toàn cục của Khách hàng — mở được từ icon giỏ trên Navbar ở MỌI trang.
 * Giữ nguyên khung `.modal-backdrop / .modal-card / .cart-item-row` của sàn,
 * bổ sung: tăng/giảm số lượng theo tồn kho, hiển thị phân loại (size/màu),
 * ước tính phí vận chuyển + VAT khớp công thức Backend.
 */
export const CustomerCartModal: React.FC = () => {
  const {
    cart,
    totalQty,
    totalAmount,
    updateQuantity,
    removeFromCart,
    clearCart,
    isCartOpen,
    setIsCartOpen,
    setIsCheckoutOpen,
  } = useCart();
  const { showToast } = useToast();

  if (!isCartOpen) return null;

  const totals = calcOrderTotals(totalAmount);
  const remainingForFreeShip = Math.max(0, FREE_SHIPPING_THRESHOLD - totalAmount + 1);
  const freeShipProgress = Math.min(100, (totalAmount / FREE_SHIPPING_THRESHOLD) * 100);

  const handleIncrease = (productId: number, specs: string | undefined, qty: number, stock: number) => {
    if (stock > 0 && qty >= stock) {
      showToast(`Chỉ còn ${stock} sản phẩm trong kho`);
      return;
    }
    updateQuantity(productId, qty + 1, specs);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      showToast('Giỏ hàng đang trống!');
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div
      id="customer-cart-modal"
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsCartOpen(false);
      }}
    >
      <div className="modal-card customer-cart-card">
        <div className="modal-header">
          <h2>Giỏ Hàng Mua Sắm ({totalQty})</h2>
          <button className="close-btn" onClick={() => setIsCartOpen(false)} type="button" aria-label="Đóng giỏ hàng">
            &times;
          </button>
        </div>

        {cart.length > 0 && (
          <div className="customer-freeship-box">
            {remainingForFreeShip > 0 && totalAmount <= FREE_SHIPPING_THRESHOLD ? (
              <p>
                Mua thêm <strong>{formatVND(remainingForFreeShip)}</strong> để được <strong>miễn phí vận chuyển</strong>
              </p>
            ) : (
              <p>🎉 Đơn hàng của bạn được <strong>miễn phí vận chuyển</strong></p>
            )}
            <div className="customer-freeship-track">
              <div className="customer-freeship-fill" style={{ width: `${freeShipProgress}%` }} />
            </div>
          </div>
        )}

        <div className="cart-items-container customer-cart-list">
          {cart.length === 0 ? (
            <div className="customer-empty-state">
              <p className="empty-cart-msg">Giỏ hàng của bạn đang trống.</p>
              <Link href="/" className="customer-link-btn" onClick={() => setIsCartOpen(false)}>
                Khám phá sản phẩm &rarr;
              </Link>
            </div>
          ) : (
            cart.map(({ product, quantity, specs }) => (
              <div key={`${product.id}-${specs}`} className="cart-item-row">
                <img
                  src={product.imageUrl || FALLBACK_IMAGE}
                  alt={product.name}
                  className="cart-item-thumb"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                  }}
                />
                <div className="cart-item-details">
                  <Link
                    href={`/product-detail/${product.id}`}
                    onClick={() => setIsCartOpen(false)}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <h4>{product.name}</h4>
                  </Link>
                  <p className="cart-item-sku">Phân loại: {specs || 'Tiêu chuẩn'}</p>
                  <p className="cart-item-price">{formatVND(product.basePrice)}</p>
                </div>
                <div className="customer-cart-actions">
                  <div className="cart-item-qty">
                    <button
                      type="button"
                      className="btn-qty"
                      aria-label="Giảm số lượng"
                      onClick={() => updateQuantity(product.id, quantity - 1, specs)}
                    >
                      −
                    </button>
                    <span className="customer-qty-value">{quantity}</span>
                    <button
                      type="button"
                      className="btn-qty"
                      aria-label="Tăng số lượng"
                      onClick={() => handleIncrease(product.id, specs, quantity, product.stockQuantity || 0)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="btn-remove-item"
                    onClick={() => removeFromCart(product.id, specs)}
                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-summary">
          <div className="summary-row">
            <span>Tạm tính ({totalQty} món):</span>
            <strong>{formatVND(totals.subtotal)}</strong>
          </div>
          <div className="summary-row">
            <span>Phí vận chuyển:</span>
            <strong>{totals.shipping === 0 ? 'Miễn phí' : formatVND(totals.shipping)}</strong>
          </div>
          <div className="summary-row">
            <span>Thuế VAT (8%):</span>
            <strong>{formatVND(totals.taxes)}</strong>
          </div>
          <div className="summary-row grand-total">
            <span>Tổng thanh toán:</span>
            <strong className="accent-price">{formatVND(totals.total)}</strong>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={clearCart} type="button" disabled={cart.length === 0}>
            Xóa tất cả
          </button>
          <button className="btn-primary" onClick={handleCheckout} type="button" disabled={cart.length === 0}>
            Tiến hành thanh toán
          </button>
        </div>
      </div>
    </div>
  );
};
