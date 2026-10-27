'use client';

import React, { useEffect, useState } from 'react';
import {
  Settings,
  Percent,
  Clock,
  DollarSign,
  Mail,
  Phone,
  ShieldAlert,
  Save,
  RefreshCw,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { adminService } from '@/services/admin.service';
import type { PlatformSettings } from '@/types/admin.types';
import { useToast } from '@/hooks/useToast';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatVND } from '@/lib/utils';

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();

  const [settings, setSettings] = useState<PlatformSettings>({
    defaultCommissionRate: 3.5,
    mallCommissionRate: 2.5,
    escrowHoldDays: 7,
    minPayoutAmount: 500000,
    supportEmail: 'concierge@aethelgard.com',
    supportHotline: '1900 8888 99',
    maintenanceMode: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await adminService.getSettings();
      setSettings(data);
    } catch (err: any) {
      showToast('Không thể tải cấu hình sàn, đang hiển thị mặc định.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const ok = await confirm({
      title: 'Lưu Cấu Hình Toàn Sàn',
      message: 'Các thay đổi về tỷ lệ hoa hồng và số ngày giữ tiền sẽ được áp dụng cho toàn bộ các giao dịch mới trên sàn Aethelgard. Bạn có chắc chắn muốn lưu?',
      confirmText: 'Lưu Cấu Hình',
      cancelText: 'Hủy',
      tone: 'default',
    });

    if (!ok) return;

    try {
      setSaving(true);
      await adminService.updateSettings(settings);
      showToast('Đã cập nhật cấu hình vận hành sàn thành công!');
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Lưu cấu hình thất bại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-serif">
            Cấu Hình Toàn Sàn Aethelgard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Điều chỉnh tỷ lệ phí hoa hồng sàn, thời gian tạm giữ thanh toán và thông tin liên hệ dịch vụ khách hàng
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSettings}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all cursor-pointer w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          <span>Tải Lại</span>
        </button>
      </div>

      {/* 2. Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Nhóm 1: Hoa hồng & Phí sàn */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Percent className="w-5 h-5 text-sky-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Chính Sách Hoa Hồng & Phí Sàn</h2>
              <p className="text-[11px] text-slate-500">Phí chiết khấu tự động trừ trên mỗi đơn hàng thành công</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Hoa hồng đối tác tiêu chuẩn (%):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  value={settings.defaultCommissionRate}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      defaultCommissionRate: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Áp dụng cho các shop thời trang thông thường.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Hoa hồng đối tác Mall Chính Hãng (%):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  value={settings.mallCommissionRate}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      mallCommissionRate: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Ưu đãi giảm phí sàn cho các thương hiệu Mall lớn.</p>
            </div>
          </div>
        </div>

        {/* Nhóm 2: Bảo chứng thanh toán & Giới hạn rút tiền */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Clock className="w-5 h-5 text-sky-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Quy Chế Giữ Tiền & Rút Tiền (Escrow)</h2>
              <p className="text-[11px] text-slate-500">Bảo vệ khách mua hàng tránh rủi ro lừa đảo hoặc đổi trả phát sinh</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Số ngày tạm giữ doanh thu (Escrow Days):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={settings.escrowHoldDays}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      escrowHoldDays: parseInt(e.target.value) || 7,
                    }))
                  }
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Ngày</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Tiền vào ví có thể rút sau số ngày này kể từ khi khách nhận hàng.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Hạn mức rút tiền tối thiểu (VNĐ):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="50000"
                  step="50000"
                  value={settings.minPayoutAmount}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      minPayoutAmount: parseFloat(e.target.value) || 500000,
                    }))
                  }
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">VNĐ</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Hiện tại: <strong>{formatVND(settings.minPayoutAmount)}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Nhóm 3: Thông tin hỗ trợ & Trạng thái bảo trì */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Mail className="w-5 h-5 text-sky-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Liên Hệ Hỗ Trợ & Vận Hành Sàn</h2>
              <p className="text-[11px] text-slate-500">Hiển thị trên footer, hóa đơn và email thông báo</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Email Hỗ Trợ Khách Hàng:
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, supportEmail: e.target.value }))
                }
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Hotline Tổng Đài Concierge:
              </label>
              <input
                type="text"
                value={settings.supportHotline}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, supportHotline: e.target.value }))
                }
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900">Chế Độ Bảo Trì Hệ Thống</span>
              <p className="text-[11px] text-slate-500">
                Khi bật, chỉ tài khoản Quản trị viên được phép truy cập sàn.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, maintenanceMode: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
            </label>
          </div>
        </div>

        {/* Nút lưu */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Đang lưu...' : 'Lưu Thay Đổi Cấu Hình'}</span>
          </button>
        </div>
      </form>

      {/* Confirmation Dialog */}
      {confirmDialog}
    </div>
  );
}
