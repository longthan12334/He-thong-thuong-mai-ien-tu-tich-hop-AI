'use client';

import React, { useState, useEffect } from 'react';
import { formatVND } from '@/lib/utils';
import { orderService } from '@/services/order.service';
import { useAuth } from '@/hooks/useAuth';
import type { CartItem } from './CartModal';

interface CheckoutModalProps {
  isOpen: boolean;
  cart: CartItem[];
  totalAmount: number;
  onClose: () => void;
  onSuccess: (orderCode: string) => void;
  onError?: (msg: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  cart,
  totalAmount,
  onClose,
  onSuccess,
  onError,
}) => {
  const { user } = useAuth();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      if (!customerName && user.fullName) setCustomerName(user.fullName);
      if (!customerEmail && user.email) setCustomerEmail(user.email);
    }
  }, [user, customerName, customerEmail]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart || cart.length === 0) {
      if (onError) onError('Giỏ hàng đang trống!');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        customerName: customerName.trim() || user?.fullName || 'Khách Mua Sắm',
        customerEmail: customerEmail.trim() || user?.email || 'customer@example.com',
        customerPhone: customerPhone.trim() || '+84 988 000 111',
        shippingAddress: address.trim() + (note ? ` (Ghi chú: ${note.trim()})` : ''),
        paymentMethod: paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : 'Thanh toán trực tuyến (Online Gateway)',
        items: cart.map((item) => ({
          productId: item.product.id,
          specs: 'Tiêu chuẩn',
          quantity: item.quantity,
        })),
      };

      const result = await orderService.createOrder(orderPayload);
      onSuccess(result.orderCode || 'AG-2026-SUCCESS');
      setAddress('');
      setNote('');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể tạo đơn hàng. Vui lòng kiểm tra lại tồn kho sản phẩm.';
      if (onError) {
        onError(msg);
      } else {
        alert(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="checkout-modal" className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <h2>Thanh Toán Đơn Hàng</h2>
          <button id="close-checkout-btn" className="close-btn" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        <form id="checkout-form" className="checkout-form" onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div className="form-group">
              <label htmlFor="customer-name" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Họ và tên (*)</label>
              <input
                id="customer-name"
                required
                placeholder="Nguyễn Văn A"
                className="form-control"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="customer-phone" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Số điện thoại (*)</label>
              <input
                id="customer-phone"
                required
                placeholder="0912345678"
                className="form-control"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label htmlFor="customer-email" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Email nhận thông báo</label>
            <input
              type="email"
              id="customer-email"
              placeholder="email@example.com"
              className="form-control"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label htmlFor="shipping-address" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Địa chỉ giao hàng (*)</label>
            <textarea
              id="shipping-address"
              required
              placeholder="Nhập số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..."
              className="form-control"
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label htmlFor="order-note" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Ghi chú đơn hàng (Tùy chọn)</label>
            <input
              type="text"
              id="order-note"
              placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi tới..."
              className="form-control"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Phương thức thanh toán</label>
            <div className="radio-group" style={{ marginTop: 8 }}>
              <label
                className="radio-card"
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: 10,
                  border: '1px solid #E2E8F0',
                  borderRadius: 8,
                  marginBottom: 8,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                />
                <div className="radio-content">
                  <strong style={{ fontSize: '0.9rem' }}>Thanh toán khi nhận hàng (COD)</strong>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
                    Trả tiền mặt trực tiếp cho shipper khi nhận kiện hàng
                  </p>
                </div>
              </label>

              <label
                className="radio-card"
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: 10,
                  border: '1px solid #E2E8F0',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="ONLINE"
                  checked={paymentMethod === 'ONLINE'}
                  onChange={() => setPaymentMethod('ONLINE')}
                />
                <div className="radio-content">
                  <strong style={{ fontSize: '0.9rem' }}>Thanh toán trực tuyến (Online Gateway)</strong>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
                    Thanh toán qua cổng tự động (Xác nhận tức thì)
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="checkout-footer" style={{ borderTop: '1px solid #E2E8F0', paddingTop: 14 }}>
            <div
              className="summary-row"
              style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}
            >
              <span>Tổng thanh toán:</span>
              <strong
                id="checkout-total"
                className="accent-price"
                style={{ fontSize: '1.2rem', color: '#8065c9' }}
              >
                {formatVND(totalAmount)}
              </strong>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary btn-large"
              style={{
                width: '100%',
                padding: '12px',
                background: isSubmitting ? '#94A3B8' : '#8065c9',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? 'Đang Xử Lý Đơn Hàng...' : 'Xác Nhận Đặt Hàng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
