'use client';

import React, { useState } from 'react';
import type { Order } from '@/types';
import { AlertCircle, Ban, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface CancelOrderModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onConfirmCancel: (order: Order, reason: string) => Promise<void>;
}

const PRESET_REASONS = [
  'Hết hàng trong kho phân phối (Out of stock)',
  'Khách hàng chủ động yêu cầu hủy đơn qua hotline',
  'Thông tin giao hàng hoặc số điện thoại không liên lạc được',
  'Nghi vấn đơn hàng trùng lặp / rủi ro spam',
  'Lý do vận hành khác',
];

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  isOpen,
  order,
  onClose,
  onConfirmCancel,
}) => {
  const [selectedReason, setSelectedReason] = useState(PRESET_REASONS[0]);
  const [detailNote, setDetailNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = detailNote.trim()
      ? `${selectedReason}: ${detailNote.trim()}`
      : selectedReason;

    setIsSubmitting(true);
    setError('');
    try {
      await onConfirmCancel(order, finalReason);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Không thể hủy đơn hàng lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <Ban className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Xác Nhận Hủy Đơn Hàng</h3>
            <p className="text-xs text-slate-500">Mã đơn #{order.orderCode || order.id}</p>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Lý do hủy đơn bắt buộc <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            disabled={isSubmitting}
            className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          >
            {PRESET_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Ghi chú chi tiết cho vận hành (tùy chọn)
          </label>
          <textarea
            rows={3}
            value={detailNote}
            onChange={(e) => setDetailNote(e.target.value)}
            disabled={isSubmitting}
            placeholder="Nhập thêm chi tiết biên bản hủy đơn..."
            className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>Xác Nhận Hủy</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
