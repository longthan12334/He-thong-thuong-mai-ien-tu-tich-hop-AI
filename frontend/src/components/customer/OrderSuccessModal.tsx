'use client';

import React from 'react';
import Link from 'next/link';
import type { Order } from '@/types';
import { Modal } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { formatVND } from '@/lib/utils';

interface OrderSuccessModalProps {
  order: Order | null;
  payment: 'COD' | 'ONLINE';
  onClose: () => void;
}

/**
 * Màn hình xác nhận đặt hàng thành công: giữ lại mã đơn để khách tra cứu,
 * hướng dẫn chuyển khoản khi chọn thanh toán trực tuyến.
 */
export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({ order, payment, onClose }) => {
  const { token } = useAuth();
  const { showToast } = useToast();
  if (!order) return null;

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
          <div className="customer-transfer-box">
            <p className="customer-transfer-title">Hướng dẫn chuyển khoản (môi trường demo)</p>
            <p>
              Nội dung chuyển khoản: <strong>{order.orderCode}</strong>
            </p>
            <p>
              Số tiền: <strong>{formatVND(order.totalAmount || 0)}</strong>
            </p>
            <p className="customer-transfer-note">
              Cổng thanh toán tự động (VNPay / MoMo / VietQR) sẽ được tích hợp ở giai đoạn sau. Đơn hàng được giữ trong 24 giờ.
            </p>
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
