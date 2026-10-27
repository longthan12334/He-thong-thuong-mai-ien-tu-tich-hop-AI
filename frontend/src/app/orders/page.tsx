'use client';
import '@/styles/orders.css';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { orderService } from '@/services/order.service';
import type { Order } from '@/types';
import { useToast } from '@/hooks/useToast';
import { useSellerGuard } from '@/hooks/useSellerGuard';
import {
  OrderKpiCards,
  OrderFilterBar,
  OrderTable,
  OrderTrackingDrawer,
  PackingSlipModal,
  CancelOrderModal,
} from '@/components/seller/orders';
import { RefreshCw, FileSpreadsheet, Printer } from 'lucide-react';
import { signalRService } from '@/services/signalr.service';
import { exportToCsv, formatDate } from '@/lib/utils';

export default function OrdersPage() {
  const { isAuthorized, isLoading: isGuardLoading } = useSellerGuard('/shop/my-orders');
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Packing Slip modal state (Item 11)
  const [packingSlipOrder, setPackingSlipOrder] = useState<Order | null>(null);
  const [isPackingSlipOpen, setIsPackingSlipOpen] = useState(false);

  // Cancellation reason modal state (Item 12)
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Load danh sách đơn hàng thực tế ngầm từ backend
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrders();
      setOrders(data || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    loadOrders();
    const unsubscribe = signalRService.subscribe((notif) => {
      if (notif.type === 'ORDER_CREATED' || notif.type === 'ORDER_STATUS' || notif.type === 'PAYMENT_CONFIRMED') {
        loadOrders();
      }
    });
    return () => unsubscribe();
  }, [loadOrders, isAuthorized]);

  // Lọc đơn hàng theo tab, khoảng ngày (Item 10) và từ khóa tìm kiếm
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return orders.filter((order) => {
      // 1. Lọc theo trạng thái
      const matchesTab =
        activeTab === 'ALL' ||
        order.status?.toUpperCase() === activeTab ||
        order.statusLabel?.toUpperCase() === activeTab;

      // 2. Lọc theo khoảng ngày (Item 10)
      let matchesDate = true;
      if (dateFilter !== 'ALL' && order.createdAt) {
        const orderDate = new Date(order.createdAt);
        if (dateFilter === 'TODAY') {
          matchesDate = order.createdAt.startsWith(todayStr);
        } else if (dateFilter === '7DAYS') {
          matchesDate = orderDate >= sevenDaysAgo;
        } else if (dateFilter === 'THIS_MONTH') {
          matchesDate = orderDate >= firstDayOfMonth;
        }
      }

      // 3. Lọc theo từ khóa tìm kiếm
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        (order.orderCode && order.orderCode.toLowerCase().includes(q)) ||
        (order.customerName && order.customerName.toLowerCase().includes(q)) ||
        (order.customerPhone && order.customerPhone.includes(q)) ||
        (order.trackingCode && order.trackingCode.toLowerCase().includes(q));

      return matchesTab && matchesDate && matchesSearch;
    });
  }, [orders, activeTab, dateFilter, searchTerm]);

  // Cập nhật trạng thái đơn hàng qua Backend API
  const handleUpdateStatus = async (orderId: number, nextStatusInt: number, statusName: string, locationNote?: string) => {
    try {
      const updated = await orderService.updateOrderStatus(orderId, {
        status: nextStatusInt,
        location: locationNote || 'Kho Trung Chuyển Aethelgard Logistics, Hà Nội',
      });

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...updated, status: updated.status } : o))
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, ...updated } : prev));
      }

      showToast(`Đơn hàng #${orderId} đã được cập nhật: ${statusName}!`);
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Cập nhật trạng thái thất bại.');
    }
  };

  // Mở modal xác nhận hủy đơn có lý do bắt buộc (Item 12)
  const handleRequestCancel = (order: Order) => {
    setOrderToCancel(order);
    setIsCancelModalOpen(true);
  };

  // Thực thi hủy đơn có lý do chi tiết
  const handleConfirmCancelWithReason = async (order: Order, reason: string) => {
    await handleUpdateStatus(order.id, 6, 'Đã Hủy Đơn', `Lý do hủy: ${reason}`);
    showToast(`Đã hủy đơn #${order.orderCode || order.id} với lý do: "${reason}".`);
  };

  // Mở phiếu đóng gói / phiếu giao hàng (Item 11)
  const handleOpenPackingSlip = (order: Order) => {
    setPackingSlipOrder(order);
    setIsPackingSlipOpen(true);
  };

  // Xuất file Excel/CSV chuẩn UTF-8 BOM tái sử dụng utility chung (Item 38)
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      showToast('Hiện không có dữ liệu đơn hàng nào để xuất báo cáo.');
      return;
    }

    exportToCsv(
      filteredOrders,
      [
        { key: (o) => o.orderCode || o.id, label: 'Mã Đơn Hàng' },
        { key: (o) => formatDate(o.createdAt, 'datetime') || o.createdAt || '', label: 'Thời Gian Đặt' },
        { key: (o) => o.customerName || '', label: 'Tên Khách Hàng' },
        { key: (o) => o.customerPhone || '', label: 'Số Điện Thoại' },
        { key: (o) => o.shippingAddress || '', label: 'Địa Chỉ Giao Hàng' },
        { key: (o) => o.paymentMethod || '', label: 'Phương Thức Thanh Toán' },
        { key: (o) => o.carrier || '', label: 'Đơn Vị Vận Chuyển' },
        { key: (o) => o.trackingCode || '', label: 'Mã Vận Đơn Tracking' },
        { key: (o) => o.statusLabel || o.status || '', label: 'Trạng Thái Đơn' },
        { key: (o) => o.totalAmount || 0, label: 'Tổng Tiền (VNĐ)' },
        { key: (o) => o.items?.length || 0, label: 'Số Loại Sản Phẩm' },
      ],
      `danh-sach-don-hang-aethelgard-${new Date().toISOString().slice(0, 10)}.csv`
    );

    showToast(`Đã xuất thành công ${filteredOrders.length} đơn hàng ra file CSV Excel!`);
  };

  const handleOpenDrawer = (order: Order) => {
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const counts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === 'PENDING').length,
      confirmed: orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PROCESSING').length,
      shipped: orders.filter((o) => o.status === 'SHIPPED').length,
      delivered: orders.filter((o) => o.status === 'DELIVERED').length,
    };
  }, [orders]);

  if (isGuardLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Đang xác thực quyền quản trị đơn hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="orders-container">
      {/* 1. Header Toolbar */}
      <div className="orders-page-header">
        <div className="orders-header-titles">
          <h1>Quản Lý Đơn Hàng & Vận Chuyển</h1>
          <p>Theo dõi luồng xử lý đơn đặt hàng, hành trình giao nhận bưu kiện và in phiếu giao hàng A5</p>
        </div>

        <div className="orders-header-actions">
          <button
            type="button"
            className="btn-order-action"
            onClick={loadOrders}
            title="Đồng bộ đơn hàng từ máy chủ"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-600' : ''}`} />
            <span>Làm Mới</span>
          </button>
          <button
            type="button"
            className="btn-order-action"
            style={{
              background: '#0284C7',
              color: '#FFFFFF',
              borderColor: '#0284C7',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onClick={handleExportCSV}
          >
            <FileSpreadsheet size={14} />
            <span>Xuất Excel (.CSV)</span>
          </button>
        </div>
      </div>

      {/* 2. Thẻ chỉ số KPI */}
      <OrderKpiCards
        totalCount={counts.all}
        pendingCount={counts.pending}
        confirmedCount={counts.confirmed}
        shippedCount={counts.shipped}
        deliveredCount={counts.delivered}
        currentFilter={activeTab}
        onFilterChange={setActiveTab}
      />

      {/* 3. Thanh bộ lọc (Kèm Date Picker Item 10) */}
      <OrderFilterBar
        currentFilter={activeTab}
        onFilterChange={setActiveTab}
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        counts={counts}
      />

      {/* 4. Bảng đơn hàng (Kèm nút In Phiếu Item 11 & Hủy Đơn Item 12) */}
      <OrderTable
        orders={filteredOrders}
        isLoading={loading}
        onSelectOrder={handleOpenDrawer}
        onConfirmOrder={(o) => handleUpdateStatus(o.id, 2, 'Đã Xác Nhận')}
        onShipOrder={(o) => handleUpdateStatus(o.id, 4, 'Đang Vận Chuyển FedEx')}
        onDeliverOrder={(o) => handleUpdateStatus(o.id, 5, 'Giao Hàng Thành Công')}
        onCancelOrder={handleRequestCancel}
        onPrintPackingSlip={handleOpenPackingSlip}
      />

      {/* 5. Ngăn theo dõi vận đơn chi tiết */}
      <OrderTrackingDrawer
        isOpen={isDrawerOpen}
        order={selectedOrder}
        onClose={handleCloseDrawer}
        onShowToast={showToast}
        onConfirmOrder={(o) => handleUpdateStatus(o.id, 2, 'Đã Xác Nhận')}
        onShipOrder={(o) => handleUpdateStatus(o.id, 4, 'Đang Vận Chuyển FedEx')}
        onDeliverOrder={(o) => handleUpdateStatus(o.id, 5, 'Giao Hàng Thành Công')}
        onCancelOrder={handleRequestCancel}
      />

      {/* 6. Modal In Phiếu Giao Hàng & Đóng Gói A5 (Item 11) */}
      <PackingSlipModal
        isOpen={isPackingSlipOpen}
        order={packingSlipOrder}
        onClose={() => setIsPackingSlipOpen(false)}
      />

      {/* 7. Modal Lý Do Hủy Đơn Hàng Bắt Buộc (Item 12) */}
      <CancelOrderModal
        isOpen={isCancelModalOpen}
        order={orderToCancel}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirmCancel={handleConfirmCancelWithReason}
      />
    </main>
  );
}
