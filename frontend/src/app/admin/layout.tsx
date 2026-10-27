'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import {
  LayoutDashboard,
  Store,
  Users,
  PackageCheck,
  CreditCard,
  Settings,
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Tổng Quan Sàn', icon: LayoutDashboard, exact: true },
    { href: '/admin/sellers', label: '273 Seller', icon: Store, count: '273' },
    { href: '/admin/users', label: 'Người Dùng', icon: Users },
    { href: '/admin/products', label: 'Kiểm Duyệt SP', icon: PackageCheck },
    { href: '/admin/payouts', label: 'Đối Soát Rút Tiền', icon: CreditCard },
    { href: '/admin/settings', label: 'Cấu Hình Sàn', icon: Settings },
  ];

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-slate-50/80 text-slate-900 font-sans">
        {/* Thanh Điều Hướng Ngang Tinh Tế & Đồng Nhất Cho Admin */}
        <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-slate-900 font-serif">
                    Quản Trị Sàn
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 font-bold border border-sky-200">
                    PORTAL
                  </span>
                </div>

                <nav className="flex items-center gap-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.exact
                      ? pathname === item.href
                      : pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                          isActive
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{item.label}</span>
                        {item.count && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                              isActive
                                ? 'bg-slate-800 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.count}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="text-[11px] text-slate-500 font-mono hidden xl:block shrink-0">
                Aethelgard Haute Couture • 273 Thương Hiệu Đối Tác
              </div>
            </div>
          </div>
        </div>

        {/* Nội dung trang */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </AdminRouteGuard>
  );
}
