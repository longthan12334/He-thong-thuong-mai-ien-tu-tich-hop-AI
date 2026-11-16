'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { Order } from '@/types';
import { orderService } from '@/services/order.service';
import { useAuth } from '@/hooks/useAuth';
import { OrderTimeline, ShopSubnav } from '@/components/customer';
import { formatVND } from '@/lib/utils';
import { FALLBACK_IMAGE } from '@/lib/constants';
import {
  CUSTOMER_STATUS_LABELS,
  formatDateTimeVN,
  isValidVNPhone,
  normalizePhone,
  normalizeStatus,
} from '@/lib/customer';

/** So khớp 9 số cuối để chấp nhận cả dạng 09xx / +849xx / có dấu cách */
const phoneTail = (p: string) => normalizePhone(p).replace(/\D/g, '').slice(-9);

/** Che bớt thông tin cá nhân khi hiển thị cho khách vãng lai */
const maskName = (name: string) =>
  name
    .split(' ')
    .map((w, i, arr) => (i === arr.length - 1 ? w : `${w.charAt(0)}.`))
    .join(' ');

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [phone, setPhone] = useState(searchParams.get('phone') || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const lookup = async (orderCode: string, phoneNumber: string) => {
    setError('');
    setOrder(null);
    const normalizedCode = orderCode.trim().toUpperCase();
    if (!/^AG-\d{4}-\d{3,6}$/.test(normalizedCode)) {
      setError('Mã đơn hàng có dạng AG-2026-XXXX');
      return;
    }
    if (!isValidVNPhone(phoneNumber)) {
      setError('Vui lòng nhập đúng số điện thoại đã dùng khi đặt hàng');
      return;
    }
    setIsLoading(true);
    try {
      const found = await orderService.getOrderByCode(normalizedCode);
      if (!found || phoneTail(found.customerPhone || '') !== phoneTail(phoneNumber)) {
        // Thông báo chung để không tiết lộ đơn hàng tồn tại hay không
        setError('Không tìm thấy đơn hàng khớp với mã đơn và số điện thoại đã nhập.');
        return;
      }
      setOrder(found);
    } catch {
      setError('Không tìm thấy đơn hàng khớp với mã đơn và số điện thoại đã nhập.');
    } finally {
      setIsLoading(false);
    }
  };

  // Tự tra cứu khi mở từ màn hình "Đặt hàng thành công"
  useEffect(() => {
    const c = searchParams.get('code');
    const p = searchParams.get('phone');
    if (c && p) lookup(c, p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const status = normalizeStatus(order?.status);

  return (
    <div className="customer-page">
      <div className="customer-page-head">
        <div>
          <h1 className="customer-page-title">Tra Cứu Đơn Hàng</h1>
          <p className="customer-page-sub">
            Không cần đăng nhập — nhập mã đơn (in trong màn hình xác nhận/email) và số điện thoại người nhận.
          </p>
        </div>
        <ShopSubnav />
      </div>

      {searchParams.get('vnpay') === 'success' && (
        <div style={{
          background: '#ECFDF5',
          border: '1px solid #6EE7B7',
          color: '#065F46',
          padding: '16px 20px',
          borderRadius: '12px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)',
        }}>
          <span style={{ fontSize: '1.5rem' }}>🎉</span>
          <div>
            <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '2px' }}>
              Thanh Toán Qua Cổng VNPay Sandbox Thành Công!
            </strong>
            <span style={{ fontSize: '0.88rem' }}>
              Hệ thống đã tự động ghi nhận thanh toán và cập nhật trạng thái đơn hàng sang <strong>Đang chuẩn bị hàng</strong>.
            </span>
          </div>
        </div>
      )}

      {searchParams.get('vnpay') === 'cancel' && (
        <div style={{
          background: '#FFFBEB',
          border: '1px solid #FCD34D',
          color: '#92400E',
          padding: '14px 18px',
          borderRadius: '12px',
          marginBottom: '20px',
        }}>
          ⚠️ Giao dịch qua cổng thanh toán VNPay đã bị hủy hoặc chưa hoàn tất. Bạn có thể tra cứu trạng thái đơn hàng bên dưới.
        </div>
      )}

      <form
        className="customer-track-form"
        onSubmit={(e) => {
          e.preventDefault();
          lookup(code, phone);
        }}
      >
        <div className="form-group">
          <label htmlFor="track-code" className="customer-form-label">Mã đơn hàng</label>
          <input
            id="track-code"
            className="form-control"
            placeholder="AG-2026-1234"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="track-phone" className="customer-form-label">Số điện thoại đặt hàng</label>
          <input
            id="track-phone"
            type="tel"
            className="form-control"
            placeholder="0912345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <button type="submit" className="customer-ai-submit" disabled={isLoading}>
          {isLoading ? 'Đang tra cứu...' : 'Tra cứu'}
        </button>
      </form>

      {error && <div className="customer-alert-error">{error}</div>}

      {order && (
        <article className="customer-order-card expanded customer-track-result">
          <header className="customer-order-head">
            <div>
              <span className="customer-order-code">{order.orderCode}</span>
              <span className="customer-order-date">Đặt lúc {formatDateTimeVN(order.createdAt)}</span>
            </div>
            <span className="customer-track-status">{CUSTOMER_STATUS_LABELS[status] || order.statusLabel}</span>
          </header>

          <OrderTimeline status={order.status} lastLocation={order.lastUpdateLocation} />

          <div className="customer-order-detail-grid">
            <div>
              <h4>Người nhận</h4>
              <p>{maskName(order.customerName || '')}</p>
            </div>
            <div>
              <h4>Vận chuyển</h4>
              <p>{order.carrier} · Mã vận đơn {order.trackingCode || '—'}</p>
              {order.estimatedDelivery && <p>Dự kiến giao: {order.estimatedDelivery}</p>}
            </div>
          </div>

          <div className="customer-order-items">
            {order.items?.map((item) => (
              <div key={item.id} className="customer-order-item">
                <img
                  src={item.imageUrl || FALLBACK_IMAGE}
                  alt={item.productName}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                  }}
                />
                <div className="customer-order-item-info">
                  <strong>{item.productName}</strong>
                  <span>{item.specs || 'Tiêu chuẩn'} · x{item.quantity}</span>
                </div>
                <span className="customer-order-item-price">{formatVND(item.subtotal || item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <footer className="customer-order-foot">
            <span>
              Tổng thanh toán: <strong className="customer-order-total">{formatVND(order.totalAmount || 0)}</strong>
            </span>
            {token ? (
              <Link href={`/shop/my-orders?code=${order.orderCode}`} className="customer-btn-outline">
                Xem trong Đơn Hàng Của Tôi
              </Link>
            ) : (
              <Link href="/login" className="customer-btn-outline">
                Đăng nhập để quản lý đơn
              </Link>
            )}
          </footer>
        </article>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={null}>
      <TrackOrderContent />
    </Suspense>
  );
}
