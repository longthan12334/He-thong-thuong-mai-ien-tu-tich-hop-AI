'use client';

import React from 'react';
import type { Order } from '@/types';
import { formatVND, formatDate } from '@/lib/utils';
import { Printer, Ban } from 'lucide-react';
import { OrderTableRowSkeleton } from '@/components/ui/Skeleton';

interface OrderTableProps {
  orders: Order[];
  isLoading?: boolean;
  onSelectOrder: (order: Order) => void;
  onConfirmOrder?: (order: Order) => void;
  onShipOrder?: (order: Order) => void;
  onDeliverOrder?: (order: Order) => void;
  onCancelOrder?: (order: Order) => void;
  onPrintPackingSlip?: (order: Order) => void;
}

const OrderTableComponent: React.FC<OrderTableProps> = ({
  orders,
  isLoading = false,
  onSelectOrder,
  onCancelOrder,
  onPrintPackingSlip,
}) => {
  return (
    <div className="orders-table-wrapper">
      <table className="orders-table">
        <thead>
          <tr>
            <th>Mã Đơn</th>
            <th>Thời Gian</th>
            <th>Khách Hàng</th>
            <th>Sản Phẩm</th>
            <th>Đơn Vị / Tracking</th>
            <th>Tổng Tiền</th>
            <th>Trạng Thái</th>
            <th style={{ textAlign: 'right' }}>Thao Tác</th>
          </tr>
        </thead>
        <tbody id="orders-table-body">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <OrderTableRowSkeleton key={`skeleton-${idx}`} />
            ))
          ) : orders.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center py-16">
                <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto text-slate-500">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xl mb-1">
                    📦
                  </div>
                  <p className="text-sm font-bold text-slate-800">Chưa Có Đơn Hàng Nào</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Hiện tại gian hàng chưa ghi nhận đơn đặt hàng mới. Đơn hàng từ khách mua sắm sẽ tự động đồng bộ tại đây theo thời gian thực qua SignalR.
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            orders.map((o) => {
              const firstItem = o.items && o.items.length > 0 ? o.items[0] : null;
              const moreItemsText =
                o.items && o.items.length > 1 ? ` +${o.items.length - 1} món khác` : '';

              return (
                <tr
                  key={o.id || o.orderCode}
                  className="order-clickable-row cursor-pointer transition-colors duration-200 hover:bg-sky-50/40"
                  onClick={() => onSelectOrder(o)}
                >
                  <td>
                    <span className="order-code-badge">#{o.orderCode || o.id}</span>
                  </td>
                  <td>
                    <div className="text-[0.82rem] font-semibold text-slate-700">
                      {formatDate(o.createdAt, 'datetime') || o.createdAt}
                    </div>
                  </td>
                  <td>
                    <div className="font-bold text-slate-900">{o.customerName}</div>
                    <div className="text-[0.74rem] text-slate-500">{o.customerPhone}</div>
                  </td>
                  <td>
                    {firstItem ? (
                      <div className="order-item-cell">
                        <img
                          className="order-thumb-img aspect-square object-cover"
                          loading="lazy"
                          decoding="async"
                          src={firstItem.imageUrl}
                          alt={firstItem.productName}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/img/products/adidas-samba.jpg';
                          }}
                        />
                        <div className="order-item-meta">
                          <strong>{firstItem.productName}</strong>
                          <span>
                            {firstItem.specs}{' '}
                            {moreItemsText && (
                              <strong className="text-sky-600">{moreItemsText}</strong>
                            )}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">Không có sản phẩm</span>
                    )}
                  </td>
                  <td>
                    <div className="font-semibold text-[0.82rem] text-slate-900">{o.carrier}</div>
                    <div className="font-mono text-[0.74rem] text-slate-500">{o.trackingCode}</div>
                  </td>
                  <td>
                    <div className="font-bold text-slate-900 text-[0.88rem]">
                      {formatVND(o.totalAmount)}
                    </div>
                    <div className="text-[0.72rem] text-slate-500">
                      {o.paymentMethod.includes('COD') ? 'COD' : 'Đã thanh toán'}
                    </div>
                  </td>
                  <td>
                    <span className={`badge-order-status ${o.status}`}>{o.statusLabel}</span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {onPrintPackingSlip && (
                        <button
                          type="button"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-sky-50 hover:border-sky-300 text-slate-600 hover:text-sky-700 transition-all cursor-pointer"
                          title="In phiếu đóng gói A5"
                          onClick={() => onPrintPackingSlip(o)}
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onCancelOrder && o.status === 'PENDING' && (
                        <button
                          type="button"
                          className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition-all cursor-pointer"
                          title="Hủy đơn hàng"
                          onClick={() => onCancelOrder(o)}
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span className="text-slate-400 text-lg font-bold ml-1">›</span>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export const OrderTable = React.memo(OrderTableComponent);
