'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import { LayoutDashboard, Store } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-slate-50/80 text-slate-900 font-sans">
        {/* Thanh Điều Hướng Ngang Tinh Tế & Đồng Nhất Cho Admin */}
        <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-slate-900 font-serif">
                    Quản Trị Sàn
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200">
                    Marketplace Portal
                  </span>
                </div>

                <nav className="flex items-center gap-1.5">
                  <Link
                    href="/admin"
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      pathname === '/admin'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Tổng Quan Sàn</span>
                  </Link>

                  <Link
                    href="/admin/sellers"
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      pathname.startsWith('/admin/sellers')
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Quản Trị 273 Seller</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        pathname.startsWith('/admin/sellers')
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      273
                    </span>
                  </Link>
                </nav>
              </div>

              <div className="text-[11px] text-slate-500 font-mono hidden md:block">
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
