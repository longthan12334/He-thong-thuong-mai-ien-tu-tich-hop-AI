'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingBag,
  Heart,
  User,
  LogIn,
  LogOut,
  ChevronDown,
  Store,
  Package,
  ShieldCheck,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useShopper } from '@/contexts/ShopperContext';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const pathname = usePathname();
  const { user, token, logout } = useAuth();
  const { totalQty, setIsCartOpen } = useCart();
  const { wishlist } = useShopper();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Đóng menu khi click ra ngoài (Item 17)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Đóng menu khi đổi route
  useEffect(() => {
    setIsUserMenuOpen(false);
  }, [pathname]);

  if (pathname === '/login') {
    return null;
  }

  const isSeller = user?.role === 'Seller';
  const isAdmin = user?.role === 'Admin';
  const isManagement = isSeller || isAdmin;
  const displayName = user?.fullName || user?.email?.split('@')[0]?.toUpperCase() || 'Khách Mua Sắm';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="navbar sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="nav-container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo Aethelgard */}
        <div className="logo flex items-center">
          <Link
            href="/"
            className="flex items-center gap-3 group"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-white font-serif font-bold text-xl shadow-md border border-slate-800 tracking-tighter group-hover:scale-105 transition-all duration-200">
              <span className="bg-gradient-to-tr from-slate-200 via-white to-slate-400 bg-clip-text text-transparent italic">Æ</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-[0.16em] text-slate-900 uppercase font-serif leading-tight">
                Aethelgard
              </span>
              <span className="text-[9px] tracking-[0.2em] text-slate-400 font-semibold uppercase -mt-0.5">
                Trung Tâm Mua Sắm • Tích Hợp AI
              </span>
            </div>
          </Link>
        </div>

        {/* Menu Điều hướng — Có prefetch={false} tối ưu băng thông */}
        <nav className="nav-links flex items-center gap-1 md:gap-2">
          {/* Seller: "/" là gian trưng bày. Admin: "/admin" là trung tâm quản trị. Khách hàng: "/shop" */}
          <Link
            href={isAdmin ? '/admin' : isSeller ? '/' : '/shop'}
            prefetch={false}
            className={`nav-link px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
              (isAdmin ? pathname.startsWith('/admin') : isSeller ? pathname === '/' : pathname === '/shop')
                ? 'bg-sky-50 text-sky-700 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            {isAdmin ? 'Quản Trị Sàn' : 'Cửa Hàng'}
          </Link>

          {/* Khách hàng / khách vãng lai: các trang mua sắm */}
          {!isManagement && (
            <Link
              href={token ? '/shop/my-orders' : '/shop/track-order'}
              prefetch={false}
              className={`nav-link px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                pathname.startsWith('/shop/my-orders') || pathname.startsWith('/shop/track-order')
                  ? 'bg-sky-50 text-sky-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              {token ? 'Đơn Hàng Của Tôi' : 'Tra Cứu Đơn'}
            </Link>
          )}

          {/* Góc người mua dành cho Seller & Admin */}
          {isManagement && (
            <Link
              href="/shop"
              prefetch={false}
              className={`nav-link px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                pathname.startsWith('/shop')
                  ? 'bg-sky-50 text-sky-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
              title="Xem sàn dưới góc nhìn người mua"
            >
              Góc Người Mua
            </Link>
          )}

          {/* Quản lý nghiệp vụ (Seller & Admin): Tồn kho, Đơn hàng, Doanh thu */}
          {token && isManagement && (
            <>
              <Link
                href="/inventory"
                prefetch={false}
                className={`nav-link px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                  pathname === '/inventory' ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                Tồn Kho
              </Link>
              <Link
                href="/orders"
                prefetch={false}
                className={`nav-link px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                  pathname === '/orders' ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                Đơn Hàng
              </Link>
              <Link
                href="/income-statistics"
                prefetch={false}
                className={`nav-link px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                  pathname === '/income-statistics' ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                Doanh Thu
              </Link>
              {isSeller && (
                <Link
                  href="/shop-profile"
                  prefetch={false}
                  className={`nav-link px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                    pathname === '/shop-profile' ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  Hồ Sơ Shop
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Khối Actions & Dropdown User Transition (Item 17) */}
        <div className="nav-actions flex items-center gap-2.5">
          {/* Chuông Thông Báo Thời Gian Thực (SignalR) */}
          <NotificationBell />

          {/* Nút Danh sách yêu thích: CHỈ DÀNH CHO KHÁCH HÀNG (Ẩn với Seller & Admin) */}
          {!isManagement && (
            <Link
              href="/shop/wishlist"
              prefetch={false}
              className={`relative p-2.5 rounded-xl border transition-all flex items-center justify-center ${
                pathname.startsWith('/shop/wishlist')
                  ? 'border-sky-300 bg-sky-50'
                  : 'border-slate-200 hover:border-sky-300 hover:bg-sky-50'
              }`}
              title="Danh sách yêu thích"
              aria-label="Danh sách yêu thích"
            >
              <Heart className="w-4 h-4 text-slate-700" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-4.5 px-1 rounded-full bg-sky-500 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                  {wishlist.length}
                </span>
              )}
            </Link>
          )}

          {/* Nút Giỏ Hàng Mua Sắm: CHỈ DÀNH CHO KHÁCH HÀNG (Loại bỏ đối với Seller & Admin) */}
          {!isManagement && (
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50 text-slate-700 transition-all flex items-center justify-center cursor-pointer"
              title="Mở giỏ hàng mua sắm"
            >
              <ShoppingBag className="w-4 h-4 text-slate-700" />
              {totalQty > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-4.5 px-1 rounded-full bg-sky-500 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                  {totalQty}
                </span>
              )}
            </button>
          )}

          {/* User Account / Profile Dropdown Menu */}
          {token && user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-xs font-bold text-slate-800 transition-all cursor-pointer"
                aria-expanded={isUserMenuOpen}
              >
                <div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-[10px] font-black">
                  {initial}
                </div>
                <span className="hidden sm:inline max-w-[110px] truncate">{displayName}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                    isAdmin
                      ? 'bg-slate-900 text-white'
                      : 'bg-sky-100 text-sky-700'
                  }`}
                >
                  {user.role}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu với hiệu ứng Scale & Opacity thả nhẹ (Item 17) */}
              <div
                className={`absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 origin-top-right transition-all duration-200 transform z-50 ${
                  isUserMenuOpen
                    ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                }`}
              >
                <div className="p-3 border-b border-slate-100 mb-1">
                  <div className="font-bold text-slate-900 text-sm truncate">{displayName}</div>
                  <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 border border-sky-200 text-sky-700 text-[10px] font-bold">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{user.role}</span>
                  </div>
                </div>

                <div className="space-y-0.5 text-xs font-semibold text-slate-700">
                  {isAdmin && (
                    <>
                      <Link
                        href="/admin"
                        prefetch={false}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-sky-50 hover:text-sky-700 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-sky-600" />
                        <span>Tổng Quan Quản Trị</span>
                      </Link>
                      <Link
                        href="/admin/sellers"
                        prefetch={false}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-sky-50 hover:text-sky-700 transition-colors"
                      >
                        <Store className="w-4 h-4 text-sky-600" />
                        <span>Duyệt Gian Hàng</span>
                      </Link>
                    </>
                  )}

                  {isSeller && (
                    <>
                      <Link
                        href="/seller/account"
                        prefetch={false}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-sky-50 hover:text-sky-700 transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>Cài Đặt Tài Khoản</span>
                      </Link>
                      <Link
                        href="/shop-profile"
                        prefetch={false}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-sky-50 hover:text-sky-700 transition-colors"
                      >
                        <Store className="w-4 h-4 text-slate-400" />
                        <span>Hồ Sơ Gian Hàng</span>
                      </Link>
                    </>
                  )}

                  {!isManagement && (
                    <Link
                      href="/shop/my-orders"
                      prefetch={false}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-sky-50 hover:text-sky-700 transition-colors"
                    >
                      <Package className="w-4 h-4 text-slate-400" />
                      <span>Đơn Hàng Của Tôi</span>
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Đăng Xuất</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-md shadow-sky-100 transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng Nhập</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
