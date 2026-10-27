'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  FileSpreadsheet,
  RefreshCw,
  ShoppingBag,
  CreditCard,
  Edit2,
  Calendar,
} from 'lucide-react';
import { adminService } from '@/services/admin.service';
import type { AdminUser } from '@/types/admin.types';
import { useToast } from '@/hooks/useToast';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { exportToCsv, formatDate, formatVND } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [roleCounts, setRoleCounts] = useState({ All: 0, Customer: 0, Seller: 0, Admin: 0 });

  // Role edit modal state
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<'Customer' | 'Seller' | 'Admin'>('Customer');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getUsers({
        search: debouncedSearch,
        role: roleFilter,
        page,
        pageSize: 25,
      });
      setUsers(res.items);
      setTotalCount(res.totalCount);
      if (res.roleCounts) {
        setRoleCounts(res.roleCounts);
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, page, showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Toggle user status (Active / Banned)
  const handleToggleStatus = async (user: AdminUser) => {
    const nextState = !user.isActive;
    const actionName = nextState ? 'Mở Khóa' : 'Khóa Tài Khoản';

    const ok = await confirm({
      title: `${actionName} Người Dùng`,
      message: `Bạn có chắc chắn muốn ${actionName.toLowerCase()} tài khoản "${user.fullName}" (${user.email})? ${
        !nextState ? 'Người dùng này sẽ không thể đăng nhập hoặc đặt hàng trên sàn.' : ''
      }`,
      confirmText: actionName,
      cancelText: 'Hủy',
      tone: nextState ? 'default' : 'danger',
    });

    if (!ok) return;

    try {
      await adminService.updateUserStatus(user.id, { isActive: nextState });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: nextState } : u))
      );
      showToast(`Đã ${actionName.toLowerCase()} thành công tài khoản #${user.id}!`);
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Cập nhật trạng thái thất bại.');
    }
  };

  // Open role assignment modal
  const handleOpenRoleModal = (user: AdminUser) => {
    setEditingUser(user);
    setSelectedRole(user.role);
  };

  // Save new role
  const handleSaveRole = async () => {
    if (!editingUser) return;
    try {
      setIsUpdatingRole(true);
      await adminService.updateUserStatus(editingUser.id, { role: selectedRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, role: selectedRole } : u))
      );
      showToast(`Đã cập nhật vai trò của "${editingUser.fullName}" thành ${selectedRole}!`);
      setEditingUser(null);
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Không thể đổi vai trò.');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // Export users to CSV
  const handleExportCSV = () => {
    if (users.length === 0) {
      showToast('Không có dữ liệu người dùng để xuất CSV.');
      return;
    }
    exportToCsv(
      users,
      [
        { key: (u) => u.id, label: 'ID' },
        { key: (u) => u.fullName, label: 'Họ và Tên' },
        { key: (u) => u.email, label: 'Email' },
        { key: (u) => u.phoneNumber || '', label: 'Số Điện Thoại' },
        { key: (u) => u.role, label: 'Vai Trò' },
        { key: (u) => (u.isActive ? 'Hoạt Động' : 'Đã Khóa'), label: 'Trạng Thái' },
        { key: (u) => u.totalSpent, label: 'Tổng Chi Tiêu (VNĐ)' },
        { key: (u) => u.orderCount, label: 'Số Đơn Hàng' },
        { key: (u) => formatDate(u.createdAt, 'datetime'), label: 'Ngày Tham Gia' },
      ],
      `danh-sach-nguoi-dung-aethelgard-${new Date().toISOString().slice(0, 10)}.csv`
    );
    showToast(`Đã xuất ${users.length} người dùng ra file CSV.`);
  };

  const roleBadgeStyle = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Seller':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-serif">
            Quản Trị Người Dùng Toàn Sàn
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Giám sát tài khoản khách mua sắm, đối tác người bán và đội ngũ quản trị viên sàn Aethelgard
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchUsers}
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
            <span>Xuất Excel (.CSV)</span>
          </button>
        </div>
      </div>

      {/* 2. Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Role Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'All', label: 'Tất Cả', count: roleCounts.All },
            { id: 'Customer', label: 'Khách Hàng', count: roleCounts.Customer },
            { id: 'Seller', label: 'Người Bán', count: roleCounts.Seller },
            { id: 'Admin', label: 'Quản Trị Viên', count: roleCounts.Admin },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setRoleFilter(tab.id);
                setPage(1);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                roleFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  roleFilter === tab.id ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, email, SĐT..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* 3. User Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4 font-semibold">Thành Viên</th>
                <th className="py-3.5 px-4 font-semibold">Vai Trò</th>
                <th className="py-3.5 px-4 font-semibold">Trạng Thái</th>
                <th className="py-3.5 px-4 font-semibold">Tổng Chi Tiêu</th>
                <th className="py-3.5 px-4 font-semibold">Đơn Hàng</th>
                <th className="py-3.5 px-4 font-semibold">Ngày Tham Gia</th>
                <th className="py-3.5 px-4 font-semibold text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 8 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200" />
                        <div className="space-y-1.5">
                          <div className="w-32 h-3.5 bg-slate-200 rounded" />
                          <div className="w-44 h-3 bg-slate-100 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4"><div className="w-16 h-5 bg-slate-200 rounded-full" /></td>
                    <td className="py-4 px-4"><div className="w-20 h-5 bg-slate-200 rounded-full" /></td>
                    <td className="py-4 px-4"><div className="w-24 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="w-12 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="w-24 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4 text-right"><div className="w-20 h-7 bg-slate-200 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold">Không tìm thấy người dùng nào phù hợp</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Thử đổi từ khóa hoặc bộ lọc vai trò</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* User profile */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 overflow-hidden">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.fullName} className="w-full h-full object-cover" />
                          ) : (
                            u.fullName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{u.fullName}</span>
                            <span className="text-[10px] text-slate-400 font-mono font-normal">#{u.id}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                          {u.phoneNumber && (
                            <div className="text-[10px] text-slate-400">{u.phoneNumber}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${roleBadgeStyle(u.role)}`}>
                        <Shield className="w-3 h-3" />
                        <span>{u.role}</span>
                      </span>
                    </td>

                    {/* Active Status */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        u.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {u.isActive ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Hoạt Động</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>Đã Khóa</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Total spent */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {formatVND(u.totalSpent)}
                    </td>

                    {/* Order count */}
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      <div className="flex items-center gap-1">
                        <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                        <span>{u.orderCount} đơn</span>
                      </div>
                    </td>

                    {/* CreatedAt */}
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] font-mono">
                      {formatDate(u.createdAt, 'datetime')}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenRoleModal(u)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all cursor-pointer"
                          title="Đổi vai trò người dùng"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className={`p-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                            u.isActive
                              ? 'border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700'
                              : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                          }`}
                          title={u.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        >
                          {u.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Hiển thị <strong>{users.length}</strong> / <strong>{totalCount}</strong> người dùng
          </span>
          <span className="font-mono text-[11px]">Trang {page}</span>
        </div>
      </div>

      {/* Role Assignment Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Phân Quyền Vai Trò Người Dùng"
        size="md"
      >
        {editingUser && (
          <div className="space-y-5">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700">
                {editingUser.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-xs">{editingUser.fullName}</p>
                <p className="text-[11px] text-slate-500 font-mono">{editingUser.email}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Vai trò hiện tại: <strong>{editingUser.role}</strong></p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Chọn vai trò mới:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Customer', 'Seller', 'Admin'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRole(r)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedRole === r
                        ? 'border-sky-500 bg-sky-50 text-sky-800 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {selectedRole === 'Admin'
                  ? '⚠️ Quyền Quản trị viên có thể kiểm soát toàn bộ sàn, duyệt shop và chỉnh sửa cấu hình tài chính.'
                  : selectedRole === 'Seller'
                  ? 'Quyền Người bán cho phép truy cập khu vực quản lý kho hàng, đơn hàng và doanh thu shop.'
                  : 'Khách mua sắm tiêu chuẩn trên sàn Aethelgard.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isUpdatingRole || selectedRole === editingUser.role}
                onClick={handleSaveRole}
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                {isUpdatingRole ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation Dialog */}
      {confirmDialog}
    </div>
  );
}
