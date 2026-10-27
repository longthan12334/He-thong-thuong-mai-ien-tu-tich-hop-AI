'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Store,
  Search,
  CheckCircle,
  AlertCircle,
  BadgeCheck,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  X,
  FileCheck,
} from 'lucide-react';
import { adminService } from '@/services/admin.service';
import type { AdminSeller, AdminSellerListResponse } from '@/types/admin.types';

export default function AdminSellersPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'All';

  const [activeTab, setActiveTab] = useState<string>(initialStatus);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [data, setData] = useState<AdminSellerListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedSeller, setSelectedSeller] = useState<AdminSeller | null>(null);
  const [modalReason, setModalReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchSellers = async (status: string, search: string, p: number, ps: number) => {
    try {
      setLoading(true);
      const res = await adminService.getSellers({
        status: status === 'All' ? undefined : status,
        search: search.trim() || undefined,
        page: p,
        pageSize: ps,
      });
      setData(res);
    } catch (err: any) {
      console.error('Error fetching sellers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers(activeTab, searchQuery, page, pageSize);
  }, [activeTab, page, pageSize]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSellers(activeTab, searchQuery, 1, pageSize);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
  };

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleUpdateStatus = async (
    sellerId: number,
    newStatus: 'Active' | 'PendingKYC' | 'Suspended',
    verified?: boolean,
    reason?: string
  ) => {
    try {
      setIsUpdating(true);
      const res = await adminService.updateSellerStatus(sellerId, {
        sellerStatus: newStatus,
        isMallVerified: verified,
        suspendedReason: newStatus === 'Suspended' ? reason || 'Vi phạm chính sách sàn' : undefined,
      });

      notify(`Cập nhật trạng thái gian hàng #${sellerId} thành công!`);
      if (selectedSeller && selectedSeller.id === sellerId) {
        setSelectedSeller(res.data);
      }
      fetchSellers(activeTab, searchQuery, page, pageSize);
    } catch (err: any) {
      notify(err?.response?.data?.message || err?.message || 'Lỗi cập nhật', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleMallVerified = async (seller: AdminSeller) => {
    const nextVal = !seller.isMallVerified;
    try {
      await adminService.updateSellerStatus(seller.id, {
        isMallVerified: nextVal,
      });
      notify(`Đã ${nextVal ? 'cấp' : 'thu hồi'} chứng nhận Mall cho ${seller.fullName}!`);
      fetchSellers(activeTab, searchQuery, page, pageSize);
    } catch (err: any) {
      notify('Lỗi thao tác: ' + (err?.response?.data?.message || err?.message), 'error');
    }
  };

  const formatVnd = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + ' đ';
  };

  const statusCounts = data?.statusCounts || { All: 273, Active: 267, PendingKYC: 5, Suspended: 1 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Store className="w-6 h-6 text-slate-800" />
            <span>Quản Trị 273 Gian Hàng Đối Tác</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Thẩm định hồ sơ KYC gian hàng, cấp chứng nhận chính hãng Mall Verified và quản trị khóa/mở quyền bán.
          </p>
        </div>

        <button
          onClick={() => fetchSellers(activeTab, searchQuery, page, pageSize)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm Mới</span>
        </button>
      </div>

      {/* Thông báo thao tác */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Tabs Phân Loại Trạng Thái */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { key: 'All', label: 'Tất Cả Gian Hàng', count: statusCounts.All },
          { key: 'Active', label: 'Đang Hoạt Động', count: statusCounts.Active, badgeClass: 'bg-emerald-50 text-emerald-700' },
          { key: 'PendingKYC', label: 'Chờ Thẩm Định KYC', count: statusCounts.PendingKYC, badgeClass: 'bg-amber-50 text-amber-700' },
          { key: 'Suspended', label: 'Bị Tạm Khóa', count: statusCounts.Suspended, badgeClass: 'bg-rose-50 text-rose-700' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.2 rounded-full ${
                  isActive
                    ? 'bg-slate-800 text-slate-200'
                    : tab.badgeClass || 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar & Page Size */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo thương hiệu hoặc email..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600 shadow-xs transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                fetchSellers(activeTab, '', 1, pageSize);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs"
            >
              ✕
            </button>
          )}
        </form>

        <div className="flex items-center gap-2 text-xs text-slate-500 self-end sm:self-auto">
          <span>Hiển thị:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-purple-600 shadow-xs"
          >
            <option value={10}>10 shop/trang</option>
            <option value={20}>20 shop/trang</option>
            <option value={50}>50 shop/trang</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="py-3.5 px-5">Gian Hàng Thương Hiệu</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4">Chứng Nhận Mall</th>
                <th className="py-3.5 px-4 text-center">Sản Phẩm</th>
                <th className="py-3.5 px-4">Doanh Thu Tạo Ra</th>
                <th className="py-3.5 px-5 text-right">Thao Tác Quản Trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Đang nạp dữ liệu gian hàng đối tác...</span>
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <Store className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Không tìm thấy gian hàng phù hợp</p>
                    <p className="text-xs text-slate-400 mt-0.5">Thử đổi từ khóa hoặc bộ lọc trạng thái</p>
                  </td>
                </tr>
              ) : (
                data?.items.map((seller) => {
                  const isPendingKyc = seller.sellerStatus === 'PendingKYC';
                  const isSuspended = seller.sellerStatus === 'Suspended';
                  const isActive = seller.sellerStatus === 'Active';

                  return (
                    <tr
                      key={seller.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => setSelectedSeller(seller)}
                    >
                      {/* Brand Info */}
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                            {seller.avatarUrl ? (
                              <img
                                src={seller.avatarUrl}
                                alt={seller.fullName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1544441893-675973e31985?w=100';
                                }}
                              />
                            ) : (
                              <Store className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                                {seller.fullName}
                              </span>
                              {seller.isMallVerified && (
                                <span title="Chứng nhận Mall Chính Hãng" className="inline-flex">
                                  <BadgeCheck className="w-4 h-4 text-purple-600 shrink-0" />
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                              <span>ID: #{seller.id}</span>
                              <span>•</span>
                              <span className="truncate">{seller.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isPendingKyc && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-semibold text-[11px]">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            <span>Chờ Duyệt KYC</span>
                          </span>
                        )}
                        {isSuspended && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-[11px]">
                            <Lock className="w-3 h-3 text-rose-600" />
                            <span>Tạm Khóa</span>
                          </span>
                        )}
                        {isActive && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-[11px]">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Hoạt Động</span>
                          </span>
                        )}
                      </td>

                      {/* Mall Verified Badge */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleMallVerified(seller);
                          }}
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                            seller.isMallVerified
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                          title="Bấm để bật/tắt tích xanh Mall"
                        >
                          <BadgeCheck className={`w-3.5 h-3.5 ${seller.isMallVerified ? 'text-purple-300' : 'text-slate-400'}`} />
                          <span>{seller.isMallVerified ? 'Mall Verified' : 'Chưa Cấp'}</span>
                        </button>
                      </td>

                      {/* Total Products */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                        {seller.totalProducts > 0 ? (
                          <span>{seller.totalProducts}</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>

                      {/* Revenue */}
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {formatVnd(seller.totalRevenue)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {isPendingKyc && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(seller.id, 'Active', true)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                            >
                              Duyệt KYC
                            </button>
                          )}

                          {isSuspended ? (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(seller.id, 'Active')}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1"
                              title="Mở khóa gian hàng"
                            >
                              <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Mở Khóa</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSeller(seller);
                                setModalReason('Tạm dừng để kiểm tra khiếu nại');
                              }}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1"
                              title="Khóa gian hàng"
                            >
                              <Lock className="w-3.5 h-3.5 text-rose-500" />
                              <span className="hidden lg:inline">Khóa</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedSeller(seller)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                          >
                            Chi Tiết
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {data && data.totalPages > 1 && (
          <div className="p-3.5 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Hiển thị <span className="font-bold text-slate-900">{(page - 1) * pageSize + 1}</span> đến{' '}
              <span className="font-bold text-slate-900">
                {Math.min(page * pageSize, data.totalCount)}
              </span>{' '}
              trong tổng số <span className="font-bold text-slate-900">{data.totalCount}</span> gian hàng
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2.5 py-1 font-mono font-semibold text-slate-900">
                {page} / {data.totalPages}
              </span>
              <button
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, data.totalPages))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Seller KYC & Management Modal (Clean White Luxury Style) */}
      {selectedSeller && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-xl relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0">
                  <img
                    src={
                      selectedSeller.avatarUrl ||
                      'https://images.unsplash.com/photo-1544441893-675973e31985?w=100'
                    }
                    alt={selectedSeller.fullName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedSeller.fullName}
                    </h3>
                    {selectedSeller.isMallVerified && (
                      <BadgeCheck className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    ID: #{selectedSeller.id} • {selectedSeller.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSeller(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Seller Vitals in Modal */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Sản Phẩm Đang Bán</p>
                <p className="text-base font-mono font-bold text-slate-900 mt-0.5">
                  {selectedSeller.totalProducts}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Doanh Số Ghi Nhận</p>
                <p className="text-xs font-mono font-bold text-slate-900 mt-1 truncate">
                  {formatVnd(selectedSeller.totalRevenue)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Phí Hoa Hồng Sàn</p>
                <p className="text-base font-mono font-bold text-purple-700 mt-0.5">
                  {selectedSeller.commissionRate}%
                </p>
              </div>
            </div>

            {/* KYC & Status Notes */}
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="font-semibold flex items-center gap-1.5 text-slate-700">
                    <FileCheck className="w-3.5 h-3.5 text-slate-600" />
                    <span>Hồ Sơ Thẩm Định KYC:</span>
                  </span>
                  <span
                    className={`font-semibold ${
                      selectedSeller.sellerStatus === 'Active'
                        ? 'text-emerald-700'
                        : selectedSeller.sellerStatus === 'PendingKYC'
                        ? 'text-amber-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {selectedSeller.sellerStatus}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {selectedSeller.kycNotes ||
                    'Đã nạp giấy phép kinh doanh thương hiệu và chứng nhận ủy quyền đối tác phân phối chính thức.'}
                </p>
              </div>

              {selectedSeller.sellerStatus === 'Suspended' && selectedSeller.suspendedReason && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                  <span className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Lý do tạm khóa gian hàng:</span>
                  </span>
                  <p>{selectedSeller.suspendedReason}</p>
                </div>
              )}

              {/* Input lý do nếu muốn khóa */}
              <div className="space-y-1 pt-1">
                <label className="text-slate-600 font-semibold">
                  Ghi chú điều chỉnh / Lý do thay đổi trạng thái:
                </label>
                <input
                  type="text"
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  placeholder="Nhập ghi chú hoặc lý do thay đổi..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-purple-600 shadow-xs"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleToggleMallVerified(selectedSeller)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  selectedSeller.isMallVerified
                    ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {selectedSeller.isMallVerified ? 'Thu Hồi Tích Xanh Mall' : 'Cấp Tích Xanh Mall'}
              </button>

              <div className="flex items-center gap-2">
                {selectedSeller.sellerStatus === 'PendingKYC' && (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus(selectedSeller.id, 'Active', true)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    Phê Duyệt KYC & Mở Bán
                  </button>
                )}

                {selectedSeller.sellerStatus === 'Suspended' ? (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus(selectedSeller.id, 'Active')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Mở Khóa Gian Hàng</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() =>
                      handleUpdateStatus(
                        selectedSeller.id,
                        'Suspended',
                        false,
                        modalReason || 'Tạm dừng để đối soát chất lượng gian hàng'
                      )
                    }
                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Tạm Khóa Shop</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
