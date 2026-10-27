'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  FileSpreadsheet,
  Building2,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { adminService } from '@/services/admin.service';
import type { AdminPayout } from '@/types/admin.types';
import { useToast } from '@/hooks/useToast';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { exportToCsv, formatDate, formatVND } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';

export default function AdminPayoutsPage() {
  const { showToast } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();

  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');

  // Approval modal state
  const [selectedPayout, setSelectedPayout] = useState<AdminPayout | null>(null);
  const [txRef, setTxRef] = useState('');
  const [payoutNote, setPayoutNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchPayouts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getPayouts({
        status: statusFilter === 'All' ? undefined : statusFilter,
      });
      setPayouts(data);
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Không thể tải danh sách lệnh rút tiền.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showToast]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  // Open approve modal
  const handleOpenApprove = (payout: AdminPayout) => {
    setSelectedPayout(payout);
    setTxRef(`VCB-FT${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(100000 + Math.random() * 900000)}`);
    setPayoutNote('Đã giải ngân thành công qua ngân hàng đối tác.');
  };

  // Submit approval
  const handleConfirmApproval = async () => {
    if (!selectedPayout) return;
    try {
      setIsProcessing(true);
      const res = await adminService.processPayout(selectedPayout.id, {
        status: 'Approved',
        transactionRef: txRef,
        note: payoutNote,
      });
      setPayouts((prev) =>
        prev.map((p) => (p.id === selectedPayout.id ? res.data : p))
      );
      showToast(`Đã duyệt giải ngân ${formatVND(selectedPayout.amount)} cho ${selectedPayout.sellerName}!`);
      setSelectedPayout(null);
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Lỗi xử lý yêu cầu rút tiền.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reject payout
  const handleRejectPayout = async (payout: AdminPayout) => {
    const ok = await confirm({
      title: 'Từ Chối Yêu Cầu Rút Tiền',
      message: `Bạn có chắc chắn muốn từ chối lệnh rút ${formatVND(payout.amount)} của "${payout.sellerName}"? Tiền sẽ được hoàn trả lại ví của Người bán.`,
      confirmText: 'Từ Chối Giải Ngân',
      cancelText: 'Quay Lại',
      tone: 'danger',
    });

    if (!ok) return;

    try {
      const res = await adminService.processPayout(payout.id, {
        status: 'Rejected',
        note: 'Thông tin tài khoản ngân hàng không khớp hoặc đang tranh chấp khiếu nại.',
      });
      setPayouts((prev) =>
        prev.map((p) => (p.id === payout.id ? res.data : p))
      );
      showToast(`Đã từ chối lệnh rút tiền #${payout.id}.`);
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Xử lý thất bại.');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (payouts.length === 0) {
      showToast('Không có dữ liệu đối soát để xuất CSV.');
      return;
    }
    exportToCsv(
      payouts,
      [
        { key: (p) => p.id, label: 'Mã Lệnh' },
        { key: (p) => p.sellerName, label: 'Gian Hàng' },
        { key: (p) => p.sellerEmail, label: 'Email' },
        { key: (p) => p.amount, label: 'Số Tiền (VNĐ)' },
        { key: (p) => p.bankName, label: 'Ngân Hàng' },
        { key: (p) => p.bankAccountNumber, label: 'Số Tài Khoản' },
        { key: (p) => p.bankAccountName, label: 'Chủ Tài Khoản' },
        { key: (p) => p.status, label: 'Trạng Thái' },
        { key: (p) => p.transactionRef || '', label: 'Mã Giao Dịch Ngân Hàng' },
        { key: (p) => formatDate(p.createdAt, 'datetime'), label: 'Thời Gian Tạo' },
        { key: (p) => (p.processedAt ? formatDate(p.processedAt, 'datetime') : ''), label: 'Thời Gian Duyệt' },
      ],
      `doi-soat-rut-tien-seller-${new Date().toISOString().slice(0, 10)}.csv`
    );
    showToast(`Đã xuất ${payouts.length} lệnh rút tiền ra file CSV.`);
  };

  // Counts
  const totalPending = payouts.filter((p) => p.status === 'Pending').reduce((s, p) => s + p.amount, 0);
  const totalApproved = payouts.filter((p) => p.status === 'Approved').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-serif">
            Đối Soát & Giải Ngân Cho Seller
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kiểm tra thông tin tài khoản ngân hàng, duyệt lệnh rút tiền và cấp mã tham chiếu giao dịch đối soát
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchPayouts}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-600' : ''}`} />
            <span>Làm Mới</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Xuất Sổ Đối Soát (.CSV)</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Đang Chờ Duyệt Giải Ngân</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {formatVND(totalPending)}
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-1">
            {payouts.filter((p) => p.status === 'Pending').length} lệnh đang chờ đối soát
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Đã Giải Ngân Thành Công</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {formatVND(totalApproved)}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            {payouts.filter((p) => p.status === 'Approved').length} lệnh đã hoàn tất
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Chính Sách Đối Soát Sàn</span>
            <ShieldCheck className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            T + 7 Ngày
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Giữ tiền bảo chứng tránh gian lận
          </p>
        </div>
      </div>

      {/* 3. Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl w-fit shadow-xs">
        {[
          { id: 'All', label: 'Tất Cả Lệnh' },
          { id: 'Pending', label: 'Chờ Giải Ngân' },
          { id: 'Approved', label: 'Đã Hoàn Tất' },
          { id: 'Rejected', label: 'Đã Từ Chối' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4 font-semibold">Mã Lệnh</th>
                <th className="py-3.5 px-4 font-semibold">Gian Hàng</th>
                <th className="py-3.5 px-4 font-semibold">Tài Khoản Thụ Hưởng</th>
                <th className="py-3.5 px-4 font-semibold">Số Tiền Rút</th>
                <th className="py-3.5 px-4 font-semibold">Trạng Thái</th>
                <th className="py-3.5 px-4 font-semibold">Thời Gian</th>
                <th className="py-3.5 px-4 font-semibold text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="py-4 px-4"><div className="w-16 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="w-32 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="w-48 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="w-24 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="w-20 h-5 bg-slate-200 rounded-full" /></td>
                    <td className="py-4 px-4"><div className="w-24 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4 text-right"><div className="w-20 h-7 bg-slate-200 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold">Không có yêu cầu rút tiền nào</p>
                  </td>
                </tr>
              ) : (
                payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      #POT-{p.id.toString().padStart(4, '0')}
                    </td>

                    {/* Seller */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{p.sellerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.sellerEmail}</div>
                    </td>

                    {/* Bank */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.bankName}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-600 font-bold">{p.bankAccountNumber}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">{p.bankAccountName}</div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                      {formatVND(p.amount)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        p.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : p.status === 'Pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {p.status === 'Approved' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Đã Giải Ngân</span>
                          </>
                        ) : p.status === 'Pending' ? (
                          <>
                            <Clock className="w-3 h-3 text-amber-500" />
                            <span>Chờ Duyệt</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-500" />
                            <span>Đã Từ Chối</span>
                          </>
                        )}
                      </span>
                      {p.transactionRef && (
                        <div className="text-[9px] font-mono text-slate-400 mt-1">Ref: {p.transactionRef}</div>
                      )}
                    </td>

                    {/* Time */}
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] font-mono">
                      {formatDate(p.createdAt, 'datetime')}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      {p.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenApprove(p)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                          >
                            Duyệt Tiền
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectPayout(p)}
                            className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all cursor-pointer"
                          >
                            Từ Chối
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Đã xử lý</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval Modal */}
      <Modal
        isOpen={!!selectedPayout}
        onClose={() => setSelectedPayout(null)}
        title="Xác Nhận Giải Ngân Chuyển Khoản"
        size="md"
      >
        {selectedPayout && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Người Bán Thụ Hưởng:</span>
                <strong className="text-slate-900">{selectedPayout.sellerName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số Tiền Rút:</span>
                <strong className="text-emerald-700 font-mono text-sm">{formatVND(selectedPayout.amount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ngân Hàng:</span>
                <span className="text-slate-800 font-semibold">{selectedPayout.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số Tài Khoản:</span>
                <span className="text-slate-800 font-mono font-bold">{selectedPayout.bankAccountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Chủ Tài Khoản:</span>
                <span className="text-slate-800 uppercase font-bold">{selectedPayout.bankAccountName}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Mã tham chiếu ngân hàng (Transaction Ref):
              </label>
              <input
                type="text"
                value={txRef}
                onChange={(e) => setTxRef(e.target.value)}
                placeholder="VD: VCB-FT241028-123456"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-sky-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Ghi chú đối soát:
              </label>
              <input
                type="text"
                value={payoutNote}
                onChange={(e) => setPayoutNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500 transition-all"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedPayout(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isProcessing || !txRef.trim()}
                onClick={handleConfirmApproval}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                {isProcessing ? 'Đang duyệt...' : 'Xác Nhận Đã Chuyển Khoản'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Dialog */}
      {confirmDialog}
    </div>
  );
}
