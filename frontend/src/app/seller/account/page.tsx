'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useSellerGuard } from '@/hooks/useSellerGuard';
import {
  User,
  Shield,
  Bell,
  KeyRound,
  LogOut,
  Building2,
  Store,
  Mail,
  Phone,
  CheckCircle2,
  Sliders,
  Sparkles,
  Lock,
} from 'lucide-react';

export default function SellerAccountPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const { isAuthorized, isLoading: isGuardLoading } = useSellerGuard('/');

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'operations'>('profile');

  // Form thông tin người bán
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    storeName: '',
    role: 'Seller',
  });

  // Form đổi mật khẩu
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Cấu hình vận hành
  const [settings, setSettings] = useState({
    orderNotification: true,
    lowStockAlert: true,
    lowStockThreshold: 10,
    autoConfirmOrders: false,
    emailDailyReport: true,
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      setProfileForm({
        fullName: user.fullName || 'Đối Tác Luxury',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '(+84) 28 3824 0000',
        storeName: user.fullName || 'Gian Hàng Chính Hãng',
        role: user.role || 'Seller',
      });
    }
  }, [user]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined' && user) {
      const updated = {
        ...user,
        fullName: profileForm.fullName,
        phoneNumber: profileForm.phoneNumber,
      };
      localStorage.setItem('aethelgard_user', JSON.stringify(updated));
    }
    showToast('Đã lưu thông tin tài khoản thành công!');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Mật khẩu mới và xác nhận mật khẩu không khớp!');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }

    setIsChangingPassword(true);
    try {
      // Giả lập lưu mật khẩu an toàn
      await new Promise((resolve) => setTimeout(resolve, 600));
      showToast('Đổi mật khẩu tài khoản seller thành công!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch {
      showToast('Không thể đổi mật khẩu, vui lòng thử lại.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
    showToast('Đã đăng xuất khỏi tài khoản đối tác.');
  };

  if (isGuardLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Đang xác thực quyền quản trị tài khoản seller...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
          <div>
            <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
              <Link href="/" className="hover:text-slate-900 transition-colors">Cửa Hàng</Link>
              <span>/</span>
              <span className="text-sky-600">Tài Khoản Đối Tác</span>
            </nav>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Quản Trị Tài Khoản Seller
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Quản lý định danh doanh nghiệp, bảo mật phân quyền và các thiết lập vận hành bán hàng.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng Xuất</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-8 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Hồ Sơ Doanh Nghiệp</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Bảo Mật & Mật Khẩu</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('operations')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'operations'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Cấu Hình Vận Hành</span>
          </button>
        </div>

        {/* TAB 1: HỒ SƠ DOANH NGHIỆP */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Thông Tin Định Danh Gian Hàng</h2>
                <p className="text-xs text-slate-500">Thông tin hiển thị chính thức trên hệ thống hợp đồng phân phối</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Tên Đại Diện Doanh Nghiệp / Thương Hiệu
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Email Quản Trị Hệ Thống
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      disabled
                      value={profileForm.email}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">Email dùng để đăng nhập và định danh tài khoản</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Số Điện Thoại Hotline Đối Tác
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={profileForm.phoneNumber}
                      onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Cấp Độ Đối Tác (Role)
                  </label>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-sky-50 border border-sky-200">
                    <CheckCircle2 className="w-5 h-5 text-sky-600" />
                    <div>
                      <span className="text-xs font-bold text-sky-950 block">Thương Hiệu Được Ủy Quyền Chính Thức</span>
                      <span className="text-[11px] text-sky-700">Quyền quản trị toàn diện: Đăng bán, Tồn kho, Báo cáo tài chính</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                <Link
                  href="/shop-profile"
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
                >
                  Xem Hồ Sơ Shop
                </Link>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-md shadow-sky-100 transition-all cursor-pointer"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: BẢO MẬT & ĐỔI MẬT KHẨU */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Thiết Lập Bảo Mật & Mật Khẩu</h2>
                <p className="text-xs text-slate-500">Cập nhật mật khẩu định kỳ để bảo vệ gian hàng và dữ liệu doanh số</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-6 max-w-lg">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Mật Khẩu Hiện Tại
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="Nhập mật khẩu hiện tại"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Mật Khẩu Mới
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="Tối thiểu 6 ký tự"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Xác Nhận Mật Khẩu Mới
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="Nhập lại mật khẩu mới"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-md shadow-sky-100 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isChangingPassword ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu Mới'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: CẤU HÌNH VẬN HÀNH */}
        {activeTab === 'operations' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Thiết Lập Thông Báo & Tồn Kho</h2>
                <p className="text-xs text-slate-500">Tùy biến cảnh báo vận hành gian hàng thời gian thực</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Thông Báo Đơn Hàng Mới Tức Thì</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Phát tín hiệu chuông và cập nhật số liệu qua SignalR khi có khách đặt hàng</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.orderNotification}
                  onChange={(e) => setSettings({ ...settings, orderNotification: e.target.checked })}
                  className="w-5 h-5 accent-sky-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Cảnh Báo Tồn Kho Thấp</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Nhận cảnh báo khi số lượng sản phẩm trong kho giảm dưới ngưỡng thiết lập</p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={settings.lowStockThreshold}
                    onChange={(e) => setSettings({ ...settings, lowStockThreshold: Number(e.target.value) })}
                    className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-center"
                  />
                  <span className="text-xs text-slate-500">sản phẩm</span>
                  <input
                    type="checkbox"
                    checked={settings.lowStockAlert}
                    onChange={(e) => setSettings({ ...settings, lowStockAlert: e.target.checked })}
                    className="w-5 h-5 accent-sky-500 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Báo Cáo Doanh Thu Định Kỳ</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Tự động tổng hợp dữ liệu doanh số và gửi báo cáo về tài khoản</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailDailyReport}
                  onChange={(e) => setSettings({ ...settings, emailDailyReport: e.target.checked })}
                  className="w-5 h-5 accent-sky-500 rounded cursor-pointer"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => showToast('Đã lưu cấu hình vận hành thành công!')}
                  className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-md shadow-sky-100 transition-all cursor-pointer"
                >
                  Lưu Cấu Hình
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
