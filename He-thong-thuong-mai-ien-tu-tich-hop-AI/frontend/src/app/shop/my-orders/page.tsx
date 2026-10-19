'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { Order } from '@/types';
import { orderService } from '@/services/order.service';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui';
import { CustomerOrderCard, ShopSubnav } from '@/components/customer';
import { formatVND } from '@/lib/utils';
import { getErrorMessage, normalizeStatus } from '@/lib/customer';

const TABS: { key: string; label: string; match: (s: string) => boolean }[] = [
  { key: 'all', label: 'Tất cả', match: () => true },
  { key: 'pending', label: 'Chờ xác nhận', match: (s) => s === 'PENDING' },
  { key: 'processing', label: 'Đang xử lý', match: (s) => s === 'CONFIRMED' || s === 'PROCESSING' },
  { key: 'shipping', label: 'Đang giao', match: (s) => s === 'SHIPPED' || s === 'SHIPPING' },
  { key: 'delivered', label: 'Đã giao', match: (s) => s === 'DELIVERED' || s === 'COMPLETED' },
  { key: 'cancelled', label: 'Đã hủy', match: (s) => s === 'CANCELLED' },
];

function MyOrdersContent() {
  const searchParams = useSearchParams();
  const highlightCode = searchParams.get('code') || '';
  const { user, token, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const isSellerView = user?.role === 'Seller' || user?.role === 'Admin';

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const data = await orderService.getMyOrders();
      setOrders(data);
      const highlighted = data.find((o) => o.orderCode === highlightCode);
      if (highlighted) setExpandedId(highlighted.id);
    } catch (err) {
      setLoadError(getErrorMessage(err, 'Không tải được danh sách đơn hàng. Vui lòng kiểm tra kết nối máy chủ.'));
    } finally {
      setIsLoading(false);
    }
  }, [highlightCode]);

  useEffect(() => {
    if (!authLoading && token) loadOrders();
  }, [authLoading, token, loadOrders]);

  // Cuộn tới đơn vừa đặt khi đi từ màn hình "Đặt hàng thành công"
  useEffect(() => {
    if (!highlightCode || isLoading) return;
    const el = document.getElementById(`order-${highlightCode}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightCode, isLoading]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    TABS.forEach((t) => {
      map[t.key] = orders.filter((o) => t.match(normalizeStatus(o.status))).length;
    });
    return map;
  }, [orders]);

  const visibleOrders = useMemo(() => {
    const tab = TABS.find((t) => t.key === activeTab) || TABS[0];
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (!tab.match(normalizeStatus(o.status))) return false;
      if (!q) return true;
      return (
        o.orderCode.toLowerCase().includes(q) ||
        o.items?.some((i) => i.productName.toLowerCase().includes(q))
      );
    });
  }, [orders, activeTab, search]);

  const totalSpent = useMemo(
    () =>
      orders
        .filter((o) => normalizeStatus(o.status) !== 'CANCELLED')
        .reduce((s, o) => s + (o.totalAmount || 0), 0),
    [orders]
  );

  const handleCancel = async (order: Order) => {
    const ok = await confirm({
      title: 'Hủy Đơn Hàng',
      message: `Bạn chắc chắn muốn hủy đơn ${order.orderCode}? Sản phẩm sẽ được hoàn lại kho của shop và không thể khôi phục đơn này.`,
      confirmText: 'Hủy Đơn',
      cancelText: 'Giữ Đơn',
      tone: 'danger',
    });
    if (!ok) return;

    setCancellingId(order.id);
    try {
      const updated = await orderService.cancelMyOrder(order.id);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, ...updated } : o)));
      showToast(`Đã hủy đơn hàng ${order.orderCode}`);
    } catch (err) {
      showToast(getErrorMessage(err, 'Không thể hủy đơn hàng lúc này.'));
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="customer-page">
      <div className="customer-page-head">
        <div>
          <h1 className="customer-page-title">Đơn Hàng Của Tôi</h1>
          <p className="customer-page-sub">
            Theo dõi hành trình kiện hàng, xem lại chi tiết thanh toán và hủy đơn khi shop chưa xác nhận.
          </p>
        </div>
        <ShopSubnav />
      </div>

      {isSellerView && (
        <div className="customer-alert-info">
          Bạn đang đăng nhập bằng tài khoản {user?.role}. Danh sách bên dưới là đơn theo phạm vi quản lý của bạn —
          để xử lý đơn hãy dùng trang <Link href="/orders">Quản lý Đơn Hàng</Link>.
        </div>
      )}

      {!isLoading && !loadError && orders.length > 0 && (
        <div className="customer-order-stats">
          <div>
            <span>Tổng đơn hàng</span>
            <strong>{orders.length}</strong>
          </div>
          <div>
            <span>Đang xử lý / giao</span>
            <strong>{counts.pending + counts.processing + counts.shipping}</strong>
          </div>
          <div>
            <span>Đã giao thành công</span>
            <strong>{counts.delivered}</strong>
          </div>
          <div>
            <span>Tổng chi tiêu</span>
            <strong>{formatVND(totalSpent)}</strong>
          </div>
        </div>
      )}

      <div className="customer-orders-toolbar">
        <div className="customer-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={activeTab === t.key}
              className={`customer-tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
              {counts[t.key] > 0 && <span className="count-tag">{counts[t.key]}</span>}
            </button>
          ))}
        </div>
        <input
          className="form-control customer-orders-search"
          placeholder="Tìm theo mã đơn hoặc tên sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="customer-order-list">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : loadError ? (
        <div className="customer-empty-state">
          <p>{loadError}</p>
          <button type="button" className="customer-link-btn" onClick={loadOrders}>
            Thử lại
          </button>
        </div>
      ) : visibleOrders.length === 0 ? (
        <div className="customer-empty-state">
          <p>
            {orders.length === 0
              ? 'Bạn chưa có đơn hàng nào. Khám phá bộ sưu tập và đặt món đầu tiên nhé!'
              : 'Không có đơn hàng nào phù hợp bộ lọc.'}
          </p>
          <Link href="/shop" className="customer-link-btn">
            Bắt đầu mua sắm →
          </Link>
        </div>
      ) : (
        <div className="customer-order-list">
          {visibleOrders.map((o) => (
            <CustomerOrderCard
              key={o.id}
              order={o}
              expanded={expandedId === o.id}
              onToggle={() => setExpandedId((prev) => (prev === o.id ? null : o.id))}
              onCancel={isSellerView ? undefined : handleCancel}
              isCancelling={cancellingId === o.id}
            />
          ))}
        </div>
      )}

      {confirmDialog}
    </div>
  );
}

export default function MyOrdersPage() {
  return (
    <Suspense fallback={null}>
      <MyOrdersContent />
    </Suspense>
  );
}
