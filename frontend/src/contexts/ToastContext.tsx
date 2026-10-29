'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  durationMs: number;
  isClosing?: boolean;
}

interface ToastContextType {
  showToast: (message: string, typeOrDuration?: ToastType | number, durationMs?: number) => void;
  removeToast: (id: string) => void;
  toasts: ToastItem[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ICON_MAP = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
  error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
  info: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
};

const BADGE_BG = {
  success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  error: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  info: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
};

const PROGRESS_BG = {
  success: '#10b981',
  error: '#f43f5e',
  warning: '#f59e0b',
  info: '#38bdf8',
};

function ToastCard({ toast, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / toast.durationMs) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [toast.durationMs]);

  return (
    <div
      role="alert"
      style={{
        backgroundColor: '#0F172A',
        color: '#FFFFFF',
        borderColor: '#334155',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
      }}
      className={`relative overflow-hidden flex items-center gap-3.5 bg-slate-900/95 backdrop-blur-md text-white px-4 py-3.5 rounded-2xl border border-slate-700 shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] min-w-[340px] max-w-md ${
        toast.isClosing
          ? 'translate-x-full opacity-0 scale-95'
          : 'translate-x-0 opacity-100 scale-100'
      }`}
    >
      <div className={`p-1.5 rounded-xl shrink-0 ${BADGE_BG[toast.type]}`}>
        {ICON_MAP[toast.type]}
      </div>
      <div
        className="flex-1 text-white text-sm font-medium leading-snug"
        style={{ color: '#FFFFFF', fontSize: '0.88rem' }}
      >
        {toast.message}
      </div>
      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
        aria-label="Đóng thông báo"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Thanh tiến trình đếm ngược thời gian */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/80">
        <div
          className="h-full transition-all duration-75 ease-linear"
          style={{
            width: `${progress}%`,
            backgroundColor: PROGRESS_BG[toast.type],
          }}
        />
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isClosing: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 250);
  }, []);

  const showToast = useCallback(
    (message: string, typeOrDuration?: ToastType | number, durationMs?: number) => {
      let type: ToastType = 'info';
      let duration = 3500;

      if (typeof typeOrDuration === 'number') {
        duration = typeOrDuration;
      } else if (typeof typeOrDuration === 'string') {
        type = typeOrDuration;
        if (typeof durationMs === 'number') {
          duration = durationMs;
        }
      }

      // Tự động nhận diện type nếu thông báo chứa từ khóa đặc trưng
      if (!typeOrDuration || typeof typeOrDuration === 'number') {
        const lower = message.toLowerCase();
        if (
          lower.includes('thành công') ||
          lower.includes('đã lưu') ||
          lower.includes('đã xóa') ||
          lower.includes('hoàn tất') ||
          lower.includes('cảm ơn') ||
          lower.includes('chúc mừng') ||
          lower.includes('đã thêm') ||
          lower.includes('đã theo dõi')
        ) {
          type = 'success';
        } else if (
          lower.includes('lỗi') ||
          lower.includes('thất bại') ||
          lower.includes('không thể') ||
          lower.includes('sai') ||
          lower.includes('tạm hết hàng') ||
          lower.includes('hết hàng')
        ) {
          type = 'error';
        } else if (
          lower.includes('chú ý') ||
          lower.includes('cảnh báo') ||
          lower.includes('vui lòng') ||
          lower.includes('yêu cầu') ||
          lower.includes('hủy')
        ) {
          type = 'warning';
        }
      }

      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setToasts((prev) => [...prev, { id, message, type, durationMs: duration }]);

      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast, toasts }}>
      {children}
      {/* Vùng hiển thị thông báo góc dưới phải */}
      <div className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-2.5 pointer-events-auto">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast phải được sử dụng bên trong <ToastProvider>');
  }
  return context;
}
