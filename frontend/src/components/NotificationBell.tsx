'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Bell, ShoppingBag, Truck, CheckCircle2, Check, Clock } from 'lucide-react';
import { signalRService, type SignalRNotification } from '@/services/signalr.service';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';

const getStorageKey = (userId?: number, email?: string) => {
  if (userId) return `aethelgard_notifications_uid_${userId}`;
  if (email) return `aethelgard_notifications_email_${email}`;
  return 'aethelgard_notifications_guest';
};

export default function NotificationBell() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SignalRNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewPulse, setHasNewPulse] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isSeller = user?.role === 'Seller';
  const isAdmin = user?.role === 'Admin';
  const isManagement = isSeller || isAdmin;

  // Dọn dẹp key cũ không phân quyền để loại bỏ triệt để thông báo rác
  useEffect(() => {
    try {
      localStorage.removeItem('aethelgard_signalr_notifications');
    } catch {}
  }, []);

  // Load thông báo theo tài khoản đang đăng nhập
  useEffect(() => {
    const key = getStorageKey(user?.id, user?.email);
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        setNotifications(Array.isArray(parsed) ? parsed : []);
      } else {
        setNotifications([]);
      }
    } catch {
      setNotifications([]);
    }
  }, [user?.id, user?.email]);

  // Tham gia nhóm SignalR theo vai trò Admin, Người bán (với SellerId cụ thể), hoặc Khách hàng
  useEffect(() => {
    signalRService.startConnection().then(() => {
      if (user?.role === 'Admin') {
        signalRService.joinAdminGroup();
      } else if (user?.role === 'Seller') {
        const sellerId = user?.id || user?.userId;
        if (sellerId) {
          signalRService.joinSellerGroup(sellerId);
        }
      }
      if (user?.email) {
        signalRService.joinCustomerGroup(user.email);
      }
    });
  }, [user?.role, user?.id, user?.userId, user?.email]);

  // Kết nối SignalR và lắng nghe thông báo thời gian thực
  useEffect(() => {
    const unsubscribe = signalRService.subscribe((notif) => {
      // Phân quyền: Khách hàng tuyệt đối không nhận thông báo tạo đơn của Người bán
      if (notif.type === 'ORDER_CREATED' && !isManagement) {
        return;
      }

      setNotifications((prev) => {
        const next = [notif, ...prev.slice(0, 29)];
        try {
          const key = getStorageKey(user?.id, user?.email);
          localStorage.setItem(key, JSON.stringify(next));
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
  }, [showToast, isManagement, user?.id, user?.email]);

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
    if (n.type === 'ORDER_CREATED') return isManagement;
    return true;
  });

  const unreadCount = visibleNotifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      try {
        const key = getStorageKey(user?.id, user?.email);
        localStorage.setItem(key, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    try {
      const key = getStorageKey(user?.id, user?.email);
      localStorage.removeItem(key);
    } catch {}
  };

  const getTargetHref = (notif: SignalRNotification) => {
    if (isAdmin) {
      return '/admin';
    }
    if (isSeller) {
      return notif.orderCode ? `/orders?code=${encodeURIComponent(notif.orderCode)}` : '/orders';
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
        return <Truck className="w-4 h-4 text-sky-600" />;
      case 'PAYMENT_CONFIRMED':
        return <CheckCircle2 className="w-4 h-4 text-sky-600" />;
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
            ? 'border-sky-500 bg-sky-50 scale-105 shadow-md shadow-sky-200'
            : isOpen
            ? 'border-sky-300 bg-sky-50'
            : 'border-slate-200 hover:border-sky-300 hover:bg-sky-50'
        }`}
        title="Thông báo hệ thống theo thời gian thực"
        aria-label="Thông báo thời gian thực"
      >
        <Bell className={`w-4 h-4 text-slate-700 ${hasNewPulse ? 'animate-bounce text-sky-600' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-4.5 px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-fade-in">
          {/* Header Dropdown */}
          <div className="p-3.5 bg-gradient-to-r from-slate-900 to-sky-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <strong className="text-xs tracking-wider uppercase font-semibold text-slate-100">
                SignalR Real-time
              </strong>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[11px] text-sky-200 hover:text-white flex items-center gap-1 font-medium transition-colors cursor-pointer"
                >
                  <Check className="w-3 h-3" /> Đã đọc
                </button>
              )}
              {visibleNotifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllNotifications}
                  className="text-[11px] text-rose-300 hover:text-rose-100 font-medium transition-colors cursor-pointer"
                  title="Xóa toàn bộ thông báo cũ"
                >
                  Xóa hết
                </button>
              )}
            </div>
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
                    !notif.read ? 'bg-sky-50/50' : ''
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
                        <span className="inline-block mt-1 text-[10px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">
                          {notif.orderCode}
                        </span>
                      )}
                    </div>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-sky-600 shrink-0 mt-2"></span>
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
