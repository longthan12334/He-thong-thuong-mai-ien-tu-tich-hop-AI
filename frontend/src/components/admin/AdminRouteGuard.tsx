'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { ShieldCheck, ArrowLeft, LogIn } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

export default function AdminRouteGuard({ children }: Props) {
  const { user, token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-600">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs uppercase tracking-widest font-semibold text-slate-500">
          Đang xác thực quyền Quản trị...
        </p>
      </div>
    );
  }

  const isAdmin = user?.role === 'Admin';

  if (!token || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-5 text-slate-800">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
            Phân Hệ Quản Trị Sàn
          </h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Khu vực này yêu cầu tài khoản Quản trị viên điều hành sàn Aethelgard Mall. Vui lòng đăng nhập bằng tài khoản Admin để tiếp tục.
          </p>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left mb-6 text-xs text-slate-600 space-y-1 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Email Admin:</span>
              <span className="font-semibold text-slate-800">admin@gmail.com</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Mật khẩu:</span>
              <span className="text-slate-800">123456789</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <Link
              href="/login"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng Nhập Quản Trị Viên</span>
            </Link>

            <Link
              href="/"
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Trở Về Trang Chủ</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
