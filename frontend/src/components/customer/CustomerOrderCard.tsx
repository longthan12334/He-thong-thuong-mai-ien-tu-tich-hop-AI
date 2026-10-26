'use client';

import React from 'react';
import Link from 'next/link';
import type { Order } from '@/types';
import { formatVND } from '@/lib/utils';
import { FALLBACK_IMAGE } from '@/lib/constants';
import { CUSTOMER_STATUS_LABELS, formatDateTimeVN, normalizeStatus } from '@/lib/customer';
import { OrderTimeline } from './OrderTimeline';

/** Map trạng thái sang class badge sẵn có trong style.css (.status-*) */
const BADGE_CLASS: Record<string, string> = {
  PENDING: 'status-PENDING',
  CONFIRMED: 'status-CONFIRMED',
  PROCESSING: 'status-CONFIRMED',
  SHIPPED: 'status-SHIPPING',
  SHIPPING: 'status-SHIPPING',
  DELIVERED: 'status-COMPLETED',
  COMPLETED: 'status-COMPLETED',
  CANCELLED: 'status-CANCELLED',
};

interface CustomerOrderCardProps {
  order: Order;
  expanded: boolean;
  onToggle: () => void;
  onCancel?: (order: Order) => void;
  isCancelling?: boolean;
  onConfirmReceived?: (order: Order) => void;
  isConfirming?: boolean;
}

export const CustomerOrderCard: React.FC<CustomerOrderCardProps> = ({
  order,
  expanded,
  onToggle,
  onCancel,
  isCancelling,
  onConfirmReceived,
  isConfirming,
}) => {
  const status = normalizeStatus(order.status);
  const label = CUSTOMER_STATUS_LABELS[status] || order.statusLabel || status;
  const itemCount = order.items?.reduce((s, i) => s + i.quantity, 0) || 0;
  const isDelivered = status === 'DELIVERED' || status === 'COMPLETED';
  const isCustomerConfirmed = order.lastUpdateLocation?.includes('Khách hàng đã nhận');
  // Khách hàng CHỈ có thể bấm "Đã nhận được hàng" khi đơn vị vận chuyển đã giao hàng thành công (DELIVERED)
  const canConfirmReceived = isDelivered && !isCustomerConfirmed;
  const firstProductId = order.items?.find((i) => i.productId)?.productId || order.items?.[0]?.productId;

  return (
    <article className={`customer-order-card ${expanded ? 'expanded' : ''}`} id={`order-${order.orderCode}`}>
      <header className="customer-order-head">
        <div>
          <span className="customer-order-code">{order.orderCode}</span>
          <span className="customer-order-date">Đặt lúc {formatDateTimeVN(order.createdAt)}</span>
        </div>
        <span className={`status-badge ${BADGE_CLASS[status] || 'status-PENDING'}`}>{label}</span>
      </header>

      <div className="customer-order-items">
        {(expanded ? order.items : order.items?.slice(0, 2))?.map((item) => (
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
        {!expanded && (order.items?.length || 0) > 2 && (
          <p className="customer-order-more">+ {(order.items?.length || 0) - 2} sản phẩm khác</p>
        )}
      </div>

      {expanded && (
        <div className="customer-order-detail">
          <OrderTimeline status={order.status} lastLocation={order.lastUpdateLocation} />

          <div className="customer-order-detail-grid">
            <div>
              <h4>Thông tin nhận hàng</h4>
              <p>{order.customerName} · {order.customerPhone}</p>
              <p>{order.shippingAddress}</p>
            </div>
            <div>
              <h4>Vận chuyển & thanh toán</h4>
              <p>{order.carrier || 'Đơn vị vận chuyển'} · Mã vận đơn {order.trackingCode || '—'}</p>
              {order.estimatedDelivery && <p>Dự kiến giao: {order.estimatedDelivery}</p>}
              <p>{order.paymentMethod}</p>
            </div>
          </div>

          <div className="customer-order-money">
            <div className="summary-row"><span>Tạm tính</span><span>{formatVND(order.subtotal || 0)}</span></div>
            <div className="summary-row">
              <span>Phí vận chuyển</span>
              <span>{order.shippingCharge ? formatVND(order.shippingCharge) : 'Miễn phí'}</span>
            </div>
            <div className="summary-row"><span>Thuế VAT</span><span>{formatVND(order.taxes || 0)}</span></div>
            {order.discount > 0 && (
              <div className="summary-row"><span>Giảm giá</span><span>-{formatVND(order.discount)}</span></div>
            )}
          </div>
        </div>
      )}

      <footer className="customer-order-foot">
        <span>
          {itemCount} sản phẩm · Tổng: <strong className="customer-order-total">{formatVND(order.totalAmount || 0)}</strong>
        </span>
        <div className="customer-order-actions">
          {status === 'PENDING' && onCancel && (
            <button
              type="button"
              className="customer-btn-outline-danger"
              onClick={() => onCancel(order)}
              disabled={isCancelling}
            >
              {isCancelling ? 'Đang hủy...' : 'Hủy đơn'}
            </button>
          )}
          {canConfirmReceived && onConfirmReceived && (
            <button
              type="button"
              className="customer-btn-success"
              onClick={() => onConfirmReceived(order)}
              disabled={isConfirming}
              title="Xác nhận bạn đã nhận được kiện hàng an toàn & đầy đủ"
            >
              {isConfirming ? 'Đang xác nhận...' : '✓ Đã nhận được hàng'}
            </button>
          )}
          {isCustomerConfirmed && (
            <>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#059669',
                  padding: '6px 12px',
                  background: '#ecfdf5',
                  borderRadius: '999px',
                  border: '1px solid #a7f3d0',
                }}
              >
                ✓ Đã nhận hàng
              </span>
              {firstProductId && (
                <Link
                  href={`/product-detail/${firstProductId}`}
                  className="customer-btn-outline-success"
                >
                  ★ Viết đánh giá
                </Link>
              )}
            </>
          )}
          <button type="button" className="customer-btn-outline" onClick={onToggle}>
            {expanded ? 'Thu gọn' : 'Xem chi tiết'}
          </button>
        </div>
      </footer>
    </article>
  );
};
