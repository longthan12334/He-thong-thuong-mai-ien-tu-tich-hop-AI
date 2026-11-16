'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Store,
  Package,
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  ExternalLink,
} from 'lucide-react';
import { adminService } from '@/services/admin.service';
import type { AdminDashboardStats } from '@/types/admin.types';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const data = await adminService.getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load admin stats:', err);
      setError(err?.response?.data?.message || err?.message || 'Không thể tải chỉ số điều hành sàn.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleQuickApproveKyc = async (sellerId: number) => {
    try {
      await adminService.updateSellerStatus(sellerId, {
        sellerStatus: 'Active',
        isMallVerified: true,
      });
      setActionSuccess(`Đã phê duyệt KYC thành công cho gian hàng #${sellerId}!`);
      setTimeout(() => setActionSuccess(null), 4000);
      fetchStats();
    } catch (err: any) {
      alert('Lỗi phê duyệt: ' + (err?.response?.data?.message || err?.message));
    }
  };

  const formatVnd = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + ' đ';
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-500">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-medium text-slate-600">Đang nạp dữ liệu điều hành sàn...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center max-w-lg mx-auto shadow-xs">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-900 mb-1">Lỗi Kết Nối</h3>
        <p className="text-xs text-slate-500 mb-4">{error || 'Không có dữ liệu.'}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs cursor-pointer hover:bg-slate-800 transition-colors"
        >
          Tải Lại
        </button>
      </div>
    );
  }

  const kycActions = stats.pendingActions.filter((a) => a.type === 'KYC');

  return (
    <div className="space-y-8">
      {/* Tiêu đề & Tác vụ làm mới */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Tổng Quan Điều Hành Sàn
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi quy mô 273 đối tác thương hiệu, thẩm định hồ sơ gian hàng và đối soát hoa hồng 3.5%.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchStats}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Làm mới số liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Làm Mới</span>
          </button>

          <Link
            href="/admin/sellers"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Quản Lý 273 Seller</span>
          </Link>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 4 Thẻ Chỉ Số Cốt Lõi Vận Hành Sàn */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: 273 Sellers */}
        <Link
          href="/admin/sellers"
          className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Đối Tác Gian Hàng
            </span>
            <Store className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">
            {stats.totalSellers} <span className="text-xs font-normal font-sans text-slate-500">shop</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="text-emerald-600 font-semibold">{stats.activeSellers} Hoạt động</span>
            <span>•</span>
            <span className="text-amber-600 font-semibold">{stats.pendingKycSellers} Chờ KYC</span>
            <span>•</span>
            <span className="text-rose-600 font-semibold">{stats.suspendedSellers} Khóa</span>
          </div>
        </Link>

        {/* Card 2: 8,618 Products */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Quy Mô Hàng Hóa
            </span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">
            {stats.totalProducts.toLocaleString()} <span className="text-xs font-normal font-sans text-slate-500">sản phẩm</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Phân bổ trên {stats.totalCategories} phân ngành thời trang xa xỉ
          </div>
        </div>

        {/* Card 3: Gross GMV */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Tổng Giá Trị Giao Dịch
            </span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 mb-1 truncate">
            {formatVnd(stats.grossGmv)}
          </div>
          <div className="text-[11px] text-slate-500">
            Ghi nhận từ {stats.totalOrders} đơn hàng thực tế toàn sàn
          </div>
        </div>

        {/* Card 4: Platform Commission (3.5%) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Doanh Thu Hoa Hồng (3.5%)
            </span>
            <Percent className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-purple-700 mb-1 truncate">
            {formatVnd(stats.platformCommission)}
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            Tiền giữ hộ đối soát: <span className="font-mono text-slate-700">{formatVnd(stats.escrowBalance)}</span>
          </div>
        </div>
      </div>

      {/* Khối Nghiệp Vụ Cốt Lõi: Thẩm Định Hồ Sơ KYC & Lối Tắt Quản Trị */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột 1 & 2: Hồ Sơ KYC Chờ Duyệt (Công việc thực tế hàng ngày của Admin) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Hồ Sơ Gian Hàng Chờ Thẩm Định KYC
              </h2>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200 font-mono">
              {stats.pendingKycSellers} hồ sơ chờ
            </span>
          </div>

          {kycActions.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">Tất cả hồ sơ gian hàng đã được thẩm định</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Không còn yêu cầu KYC nào đang tồn đọng.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {kycActions.map((action) => {
                const sellerIdMatch = action.id.match(/\d+/);
                const sellerId = sellerIdMatch ? parseInt(sellerIdMatch[0]) : null;

                return (
                  <div key={action.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{action.title}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 font-mono border border-amber-200">
                          KYC
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{action.subtitle}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {sellerId && (
                        <button
                          type="button"
                          onClick={() => handleQuickApproveKyc(sellerId)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                        >
                          Duyệt KYC
                        </button>
                      )}
                      <Link
                        href={`/admin/sellers?status=PendingKYC`}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                      >
                        Xem Chi Tiết
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-2 text-right">
            <Link
              href="/admin/sellers?status=PendingKYC"
              className="text-xs text-purple-700 hover:text-purple-900 font-semibold inline-flex items-center gap-1"
            >
              <span>Xem toàn bộ 273 gian hàng</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Cột 3: Lối Tắt Phân Hệ Sàn (Không làm lại, tận dụng các trang đã có) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-sm font-bold text-slate-900">
                Phân Hệ Quản Trị Hệ Thống
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Các cổng nghiệp vụ vận hành đã có sẵn trong hệ thống
              </p>
            </div>

            <div className="space-y-2">
              <Link
                href="/admin/sellers"
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 transition-colors flex items-center justify-between text-xs group"
              >
                <div>
                  <p className="font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">
                    Quản Trị 273 Gian Hàng
                  </p>
                  <p className="text-[11px] text-slate-500">Duyệt KYC, cấp tích xanh Mall, khóa shop</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
              </Link>

              <Link
                href="/income-statistics"
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 transition-colors flex items-center justify-between text-xs group"
              >
                <div>
                  <p className="font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">
                    Báo Cáo Doanh Thu & Dòng Tiền
                  </p>
                  <p className="text-[11px] text-slate-500">Biểu đồ 12 tháng, ngành hàng và đối soát</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
              </Link>

              <Link
                href="/orders"
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 transition-colors flex items-center justify-between text-xs group"
              >
                <div>
                  <p className="font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">
                    Theo Dõi Đơn Hàng Sàn
                  </p>
                  <p className="text-[11px] text-slate-500">23 đơn hàng phát sinh, trạng thái giao vận</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
              </Link>

              <Link
                href="/inventory"
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 transition-colors flex items-center justify-between text-xs group"
              >
                <div>
                  <p className="font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">
                    Kiểm Soát Tồn Kho & Hàng Hóa
                  </p>
                  <p className="text-[11px] text-slate-500">8.618 mặt hàng, biến thể và AI Copilot</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Link
              href="/shop"
              className="w-full py-2.5 px-3 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/80 text-purple-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <span>Xem Giao Diện Mua Sắm Khách Hàng</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
