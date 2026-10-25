'use client';

import React, { useEffect, useState } from 'react';
import type { Order } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { orderService } from '@/services/order.service';
import { formatVND } from '@/lib/utils';
import { calcOrderTotals, getErrorMessage, isValidVNPhone, normalizePhone } from '@/lib/customer';

const LAST_SHIPPING_KEY = 'aethelgard_last_shipping';

export const PAYMENT_LABELS = {
  COD: 'Thanh toán khi nhận hàng (COD)',
  ONLINE: 'Thanh toán trực tuyến (Cổng thanh toán)',
} as const;

interface CustomerCheckoutModalProps {
  onSuccess: (order: Order, payment: 'COD' | 'ONLINE') => void;
}

/**
 * Form thanh toán phía Khách hàng — cùng khung với CheckoutModal của sàn, bổ sung:
 * - Gửi đúng phân loại size/màu của từng món (Backend dùng để trừ tồn kho biến thể)
 * - Kiểm tra định dạng SĐT Việt Nam, không tự điền dữ liệu giả
 * - Bảng tính tạm tính / phí vận chuyển / VAT khớp Backend
 * - Ghi nhớ thông tin giao hàng lần trước để đặt nhanh lần sau
 */
export const CustomerCheckoutModal: React.FC<CustomerCheckoutModalProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const { cart, totalAmount, isCheckoutOpen, setIsCheckoutOpen, setIsCartOpen } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  // Điền sẵn từ tài khoản + thông tin giao hàng lần trước
  useEffect(() => {
    if (!isCheckoutOpen) return;
    try {
      const saved = JSON.parse(localStorage.getItem(LAST_SHIPPING_KEY) || 'null');
      if (saved) {
        setCustomerName((v) => v || saved.customerName || '');
        setCustomerPhone((v) => v || saved.customerPhone || '');
        setCustomerEmail((v) => v || saved.customerEmail || '');
        setAddress((v) => v || saved.address || '');
      }
    } catch {
      // bỏ qua
    }
    if (user) {
      setCustomerName((v) => v || user.fullName || '');
      setCustomerEmail((v) => v || user.email || '');
    }
    setServerError('');
  }, [isCheckoutOpen, user]);

  if (!isCheckoutOpen) return null;

  const totals = calcOrderTotals(totalAmount);

  const validate = () => {
    const next: Record<string, string> = {};
    if (customerName.trim().length < 2) next.customerName = 'Vui lòng nhập họ tên người nhận';
    if (!isValidVNPhone(customerPhone)) next.customerPhone = 'Số điện thoại không hợp lệ (VD: 0912345678)';
    if (customerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      next.customerEmail = 'Email không đúng định dạng';
    }
    if (address.trim().length < 10) next.address = 'Vui lòng nhập địa chỉ chi tiết (số nhà, đường, phường, quận, tỉnh)';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setServerError('Giỏ hàng đang trống!');
      return;
    }
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError('');
    try {
      const phone = normalizePhone(customerPhone);
      const order = await orderService.createOrder({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: phone,
        shippingAddress: address.trim() + (note.trim() ? ` (Ghi chú: ${note.trim()})` : ''),
        paymentMethod: PAYMENT_LABELS[paymentMethod],
        items: cart.map((item) => ({
          productId: item.product.id,
          specs: item.specs || 'Tiêu chuẩn',
          quantity: item.quantity,
        })),
      });

      try {
        localStorage.setItem(
          LAST_SHIPPING_KEY,
          JSON.stringify({ customerName: customerName.trim(), customerPhone: phone, customerEmail: customerEmail.trim(), address: address.trim() })
        );
      } catch {
        // bỏ qua
      }
      setNote('');
      onSuccess(order, paymentMethod);
    } catch (err) {
      setServerError(getErrorMessage(err, 'Không thể tạo đơn hàng. Vui lòng kiểm tra lại tồn kho hoặc kết nối máy chủ.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldError = (key: string) =>
    errors[key] ? <span className="customer-field-error">{errors[key]}</span> : null;

  return (
    <div id="customer-checkout-modal" className="modal-backdrop">
      <div className="modal-card customer-checkout-card" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h2>Thanh Toán Đơn Hàng</h2>
          <button className="close-btn" onClick={() => setIsCheckoutOpen(false)} type="button" aria-label="Đóng">
            &times;
          </button>
        </div>

        {/* Tóm tắt món hàng */}
        <div className="customer-checkout-items">
          {cart.map((item) => (
            <div key={`${item.product.id}-${item.specs}`} className="customer-checkout-item">
              <span className="customer-checkout-item-name">
                {item.quantity} × {item.product.name}
                <em>{item.specs}</em>
              </span>
              <span>{formatVND(item.product.basePrice * item.quantity)}</span>
            </div>
          ))}
          <button
            type="button"
            className="customer-text-btn"
            onClick={() => {
              setIsCheckoutOpen(false);
              setIsCartOpen(true);
            }}
          >
            ← Chỉnh sửa giỏ hàng
          </button>
        </div>

        <form className="checkout-form" onSubmit={handleSubmit} noValidate>
          <div className="customer-form-grid">
            <div className="form-group">
              <label htmlFor="cus-name" className="customer-form-label">Họ và tên (*)</label>
              <input
                id="cus-name"
                placeholder="Nguyễn Văn A"
                className="form-control"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                autoComplete="name"
              />
              {fieldError('customerName')}
            </div>
            <div className="form-group">
              <label htmlFor="cus-phone" className="customer-form-label">Số điện thoại (*)</label>
              <input
                id="cus-phone"
                type="tel"
                placeholder="0912345678"
                className="form-control"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                autoComplete="tel"
              />
              {fieldError('customerPhone')}
            </div>
          </div>

          <div className="form-group customer-form-row">
            <label htmlFor="cus-email" className="customer-form-label">Email nhận thông báo</label>
            <input
              type="email"
              id="cus-email"
              placeholder="email@example.com"
              className="form-control"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              autoComplete="email"
            />
            {fieldError('customerEmail')}
          </div>

          <div className="form-group customer-form-row">
            <label htmlFor="cus-address" className="customer-form-label">Địa chỉ giao hàng (*)</label>
            <textarea
              id="cus-address"
              placeholder="Nhập số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..."
              className="form-control"
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              autoComplete="street-address"
            />
            {fieldError('address')}
          </div>

          <div className="form-group customer-form-row">
            <label htmlFor="cus-note" className="customer-form-label">Ghi chú đơn hàng (Tùy chọn)</label>
            <input
              type="text"
              id="cus-note"
              placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi tới..."
              className="form-control"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="form-group customer-form-row">
            <label className="customer-form-label">Phương thức thanh toán</label>
            <div className="radio-group" style={{ marginTop: 8 }}>
              {(['COD', 'ONLINE'] as const).map((method) => (
                <label
                  key={method}
                  className={`radio-card customer-radio-card ${paymentMethod === method ? 'active' : ''}`}
                >
                  <input
                    type="radio"
                    name="customer_payment_method"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={() => setPaymentMethod(method)}
                  />
                  <div className="radio-content">
                    <strong style={{ fontSize: '0.9rem' }}>{PAYMENT_LABELS[method]}</strong>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
                      {method === 'COD'
                        ? 'Trả tiền mặt trực tiếp cho shipper khi nhận kiện hàng'
                        : 'Chuyển khoản theo mã QR / thông tin tài khoản hiển thị sau khi đặt hàng'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="checkout-footer" style={{ borderTop: '1px solid #E2E8F0', paddingTop: 14 }}>
            <div className="summary-row">
              <span>Tạm tính:</span>
              <span>{formatVND(totals.subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Phí vận chuyển:</span>
              <span>{totals.shipping === 0 ? 'Miễn phí' : formatVND(totals.shipping)}</span>
            </div>
            <div className="summary-row">
              <span>Thuế VAT (8%):</span>
              <span>{formatVND(totals.taxes)}</span>
            </div>
            <div className="summary-row" style={{ marginBottom: 14 }}>
              <strong>Tổng thanh toán:</strong>
              <strong className="accent-price" style={{ fontSize: '1.2rem', color: '#8065c9' }}>
                {formatVND(totals.total)}
              </strong>
            </div>

            {serverError && <div className="customer-alert-error">{serverError}</div>}

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
