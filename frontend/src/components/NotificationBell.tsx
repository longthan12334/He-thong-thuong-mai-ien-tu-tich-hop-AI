'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Bell, ShoppingBag, Truck, CheckCircle2, Check, Clock } from 'lucide-react';
import { signalRService, type SignalRNotification } from '@/services/signalr.service';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';

const NOTIFICATIONS_STORAGE_KEY = 'aethelgard_signalr_notifications';

export default function NotificationBell() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SignalRNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewPulse, setHasNewPulse] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load thông báo từ localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (saved) {
        setNotifications(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const isSeller = user?.role === 'Seller' || user?.role === 'Admin';

  // Tham gia nhóm SignalR theo vai trò Người bán hoặc Khách hàng
  useEffect(() => {
    signalRService.startConnection().then(() => {
      if (isSeller) {
        signalRService.joinSellerGroup(user?.userId);
      }
      if (user?.email) {
        signalRService.joinCustomerGroup(user.email);
      }
    });
  }, [isSeller, user?.email]);

  // Kết nối SignalR và lắng nghe thông báo thời gian thực
  useEffect(() => {
    const unsubscribe = signalRService.subscribe((notif) => {
      // Phân quyền: Khách hàng tuyệt đối không nhận thông báo tạo đơn của Người bán
      if (notif.type === 'ORDER_CREATED' && !isSeller) {
        return;
      }

      setNotifications((prev) => {
        const next = [notif, ...prev.slice(0, 29)];
        try {
          localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });

      // Hiệu ứng rung chuông và thông báo Toast
      setHasNewPulse(true);
      setTimeout(() => setHasNewPulse(false), 2500);

      showToast(`🔔 ${notif.title}: ${notif.message}`);

      // Phát âm báo tinh tế nhẹ nhàng
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } catch {}
    });

    return () => {
      unsubscribe();
    };
  }, [showToast, isSeller]);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Lọc thông báo: Người mua hàng sẽ không thấy thông báo tạo đơn của Người bán
  const visibleNotifications = notifications.filter((n) => {
    if (n.type === 'ORDER_CREATED') return isSeller;
    return true;
  });

  const unreadCount = visibleNotifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      try {
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const getTargetHref = (notif: SignalRNotification) => {
    const isSeller = user?.role === 'Seller' || user?.role === 'Admin';
    if (isSeller) {
      return '/orders';
    }
    if (notif.orderCode) {
      return `/shop/track-order?code=${encodeURIComponent(notif.orderCode)}`;
    }
    return '/shop/my-orders';
  };

  const renderIcon = (type: SignalRNotification['type']) => {
    switch (type) {
      case 'ORDER_CREATED':
        return <ShoppingBag className="w-4 h-4 text-emerald-600" />;
      case 'ORDER_STATUS':
        return <Truck className="w-4 h-4 text-indigo-600" />;
      case 'PAYMENT_CONFIRMED':
        return <CheckCircle2 className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  const formatTimeAgo = (isoString: string) => {
    try {
      const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diff < 60) return 'Vừa xong';
      if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
      return new Date(isoString).toLocaleDateString('vi-VN');
    } catch {
      return 'Gần đây';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Nút Chuông */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
          hasNewPulse
            ? 'border-purple-500 bg-purple-50 scale-105 shadow-md shadow-purple-200'
            : isOpen
            ? 'border-purple-300 bg-purple-50'
            : 'border-slate-200 hover:border-purple-300 hover:bg-purple-50'
        }`}
        title="Thông báo hệ thống theo thời gian thực"
        aria-label="Thông báo thời gian thực"
      >
        <Bell className={`w-5 h-5 text-slate-700 ${hasNewPulse ? 'animate-bounce text-purple-600' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-rose-600 text-white text-[11px] font-black flex items-center justify-center shadow-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-fade-in">
          {/* Header Dropdown */}
          <div className="p-3.5 bg-gradient-to-r from-slate-900 to-purple-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <strong className="text-xs tracking-wider uppercase font-semibold text-slate-100">
                SignalR Real-time
              </strong>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] text-purple-200 hover:text-white flex items-center gap-1 font-medium transition-colors"
              >
                <Check className="w-3 h-3" /> Đánh dấu đã đọc
              </button>
            )}
          </div>

          {/* Danh sách thông báo */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {visibleNotifications.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Chưa có thông báo nào mới</p>
                <span className="text-[11px] text-slate-400">Kết nối SignalR đang sẵn sàng nhận dữ liệu</span>
              </div>
            ) : (
              visibleNotifications.map((notif) => (
                <Link
                  key={notif.id}
                  href={getTargetHref(notif)}
                  onClick={() => setIsOpen(false)}
                  className={`block p-3.5 hover:bg-slate-50 transition-colors text-left ${
                    !notif.read ? 'bg-purple-50/50' : ''
                  }`}
                  style={{ textDecoration: 'none' }}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                      {renderIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <strong className="text-xs font-bold text-slate-900 truncate">
                          {notif.title}
                        </strong>
                        <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" /> {formatTimeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-[12px] text-slate-600 line-clamp-2 leading-relaxed m-0">
                        {notif.message}
                      </p>
                      {notif.orderCode && (
                        <span className="inline-block mt-1 text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                          {notif.orderCode}
                        </span>
                      )}
                    </div>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0 mt-2"></span>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Footer Dropdown */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-500 font-medium">
              Đồng bộ tức thì mọi thay đổi đơn hàng & thanh toán
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
