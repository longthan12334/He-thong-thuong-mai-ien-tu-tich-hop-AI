'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, ShoppingBag, Store, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { SELLER_NAV_LINKS } from '@/lib/constants';

export default function Navbar() {
  const pathname = usePathname();
  const { user, token, logout } = useAuth();
  const { totalQty, setIsCartOpen } = useCart();

  // Ẩn thanh Navbar riêng ở trang login để giữ layout tập trung
  if (pathname === '/login') {
    return null;
  }

  const isSeller = user?.role === 'Seller' || user?.role === 'Admin';
  const displayName = user?.fullName || user?.email?.split('@')[0]?.toUpperCase() || 'Khách Mua Sắm';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="navbar sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="nav-container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="logo flex items-center">
          <Link
            href="/"
            className="flex items-center gap-3 group"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-white font-serif font-bold text-xl shadow-md border border-slate-800 tracking-tighter group-hover:scale-105 transition-all">
              <span className="bg-gradient-to-tr from-slate-200 via-white to-slate-400 bg-clip-text text-transparent italic">Æ</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-[0.16em] text-slate-900 uppercase font-serif leading-tight">
                Aethelgard
              </span>
              <span className="text-[9px] tracking-[0.2em] text-slate-400 font-semibold uppercase -mt-0.5">
                Shopping Mall • AI Powered
              </span>
            </div>
          </Link>
        </div>

        {/* Menu Điều hướng */}
        <nav className="nav-links flex items-center gap-1 md:gap-3">
          <Link
            href="/"
            className={`nav-link px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              pathname === '/' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Cửa Hàng
          </Link>

          {/* Nếu là tài khoản Seller hoặc Admin: hiển thị thêm các tab quản lý */}
          {token && isSeller && (
            <>
              <Link
                href="/inventory"
                className={`nav-link px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  pathname === '/inventory' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Tồn Kho
              </Link>
              <Link
                href="/orders"
                className={`nav-link px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  pathname === '/orders' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Đơn Hàng
              </Link>
              <Link
                href="/income-statistics"
                className={`nav-link px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  pathname === '/income-statistics' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Doanh Thu
              </Link>
              <Link
                href="/shop-profile"
                className={`nav-link px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  pathname === '/shop-profile' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Hồ Sơ Shop
              </Link>
            </>
          )}
        </nav>

        {/* Khối Actions: Nút Giỏ hàng & Đăng nhập / User info */}
        <div className="nav-actions flex items-center gap-3">
          {/* Nút Giỏ Hàng Mua Sắm (Dùng chung cho cả Khách và Seller) */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-slate-700 transition-all flex items-center justify-center cursor-pointer"
            title="Mở giỏ hàng mua sắm"
          >
            <ShoppingBag className="w-5 h-5 text-slate-700" />
            {totalQty > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-purple-600 text-white text-[11px] font-black flex items-center justify-center shadow-sm">
                {totalQty}
              </span>
            )}
          </button>

          {token && user ? (
            <div className="flex items-center gap-2">
              <div
                title={`Đang đăng nhập: ${displayName} (${user.role})`}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold text-slate-800"
              >
                <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">
                  {initial}
                </div>
                <span className="max-w-[120px] truncate">{displayName}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-semibold">
                  {user.role}
                </span>
              </div>

              <button
                onClick={logout}
                title="Đăng xuất"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-all cursor-pointer"
                type="button"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-200 transition-all"
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
