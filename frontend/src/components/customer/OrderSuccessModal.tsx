'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { Order } from '@/types';
import { Modal } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { orderService } from '@/services/order.service';
import { formatVND } from '@/lib/utils';

interface OrderSuccessModalProps {
  order: Order | null;
  payment: 'COD' | 'ONLINE';
  onClose: () => void;
}

/**
 * Màn hình xác nhận đặt hàng thành công: giữ lại mã đơn để khách tra cứu,
 * tích hợp Cổng thanh toán trực tuyến VNPay Sandbox.
 */
export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({ order, payment, onClose }) => {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [isRedirectingVnpay, setIsRedirectingVnpay] = useState(false);
  if (!order) return null;

  const handlePayWithVnpay = async () => {
    setIsRedirectingVnpay(true);
    try {
      const url = await orderService.getVnpayUrl(order.id);
      if (url) {
        window.location.href = url;
      } else {
        showToast('Không lấy được URL thanh toán VNPay.');
      }
    } catch {
      showToast('Lỗi kết nối cổng thanh toán VNPay Sandbox.');
    } finally {
      setIsRedirectingVnpay(false);
    }
  };

  const trackHref = token
    ? `/shop/my-orders?code=${encodeURIComponent(order.orderCode)}`
    : `/shop/track-order?code=${encodeURIComponent(order.orderCode)}&phone=${encodeURIComponent(order.customerPhone || '')}`;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(order.orderCode);
      showToast(`Đã sao chép mã đơn ${order.orderCode}`);
    } catch {
      showToast('Không thể sao chép, vui lòng ghi lại mã đơn hàng.');
    }
  };

  return (
    <Modal isOpen={!!order} onClose={onClose} size="md">
      <div className="customer-success">
        <div className="customer-success-icon">✓</div>
        <h3 className="customer-success-title">Đặt hàng thành công!</h3>
        <p className="customer-success-sub">
          Cảm ơn {order.customerName || 'bạn'} đã mua sắm tại Aethelgard Mall. Boutique sẽ xác nhận đơn trong thời gian sớm nhất.
        </p>

        <div className="customer-success-code">
          <span>Mã đơn hàng</span>
          <strong>{order.orderCode}</strong>
          <button type="button" onClick={copyCode} className="customer-text-btn">
            Sao chép
          </button>
        </div>

        <div className="customer-success-summary">
          <div className="summary-row">
            <span>Số sản phẩm</span>
            <span>{order.items?.reduce((s, i) => s + i.quantity, 0) || 0} món</span>
          </div>
          <div className="summary-row">
            <span>Giao tới</span>
            <span className="customer-success-address">{order.shippingAddress}</span>
          </div>
          {order.estimatedDelivery && (
            <div className="summary-row">
              <span>Dự kiến giao</span>
              <span>{order.estimatedDelivery}</span>
            </div>
          )}
          <div className="summary-row grand-total">
            <span>Tổng thanh toán</span>
            <strong className="accent-price">{formatVND(order.totalAmount || 0)}</strong>
          </div>
        </div>

        {payment === 'ONLINE' && (
          <div className="customer-transfer-box" style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: '1.25rem' }}>💳</span>
              <strong style={{ color: '#0369A1', fontSize: '0.95rem' }}>Cổng Thanh Toán VNPay Sandbox</strong>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#0C4A6E', marginBottom: 12 }}>
              Đơn hàng của bạn đã được khởi tạo. Bạn có thể thanh toán trực tuyến ngay qua thẻ ATM nội địa hoặc quét mã QR VNPay Sandbox.
            </p>

            <button
              type="button"
              onClick={handlePayWithVnpay}
              disabled={isRedirectingVnpay}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: isRedirectingVnpay ? '#94A3B8' : '#0284C7',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                cursor: isRedirectingVnpay ? 'not-allowed' : 'pointer',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
              }}
            >
              {isRedirectingVnpay ? 'Đang chuyển hướng sang VNPay...' : '🚀 Thanh Toán Ngay Qua VNPay Sandbox'}
            </button>

            <div style={{ fontSize: '0.78rem', color: '#475569', background: '#fff', padding: 10, borderRadius: 8, border: '1px dashed #CBD5E1' }}>
              <strong style={{ display: 'block', color: '#0F172A', marginBottom: 4 }}>Thẻ Thử Nghiệm Sandbox VNPay:</strong>
              <div>• Ngân hàng: <strong>NCB</strong></div>
              <div>• Số thẻ: <strong>9704198526191432198</strong></div>
              <div>• Tên chủ thẻ: <strong>NGUYEN VAN A</strong></div>
              <div>• Ngày phát hành: <strong>07/15</strong> | OTP: <strong>123456</strong></div>
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Tiếp tục mua sắm
          </button>
          <Link href={trackHref} className="btn-primary customer-btn-link" onClick={onClose}>
            Theo dõi đơn hàng
          </Link>
        </div>
      </div>
    </Modal>
  );
};
