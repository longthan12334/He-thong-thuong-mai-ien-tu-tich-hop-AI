'use client';

import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  className?: string;
  hideCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
}

const sizeClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  '2xl': 'max-w-3xl',
  '3xl': 'max-w-4xl',
  full: 'max-w-[95vw] sm:max-w-[90vw]',
};

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'xl',
  className,
  hideCloseButton = false,
  closeOnBackdropClick = true,
}: ModalProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Kích hoạt animation sau khi mount
      const id = setTimeout(() => {
        setIsAnimating(true);
      }, 20);
      return () => clearTimeout(id);
    } else {
      setIsAnimating(false);
      // Chờ animation chạy xong (250ms) mới unmount
      timerRef.current = setTimeout(() => {
        setShouldRender(false);
      }, 250);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [isOpen]);

  // Phím tắt ESC đóng modal êm ái
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        'fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6',
        'bg-slate-950/60 backdrop-blur-sm',
        'transition-opacity duration-250 ease-out',
        isAnimating ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      onClick={(e) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={cn(
          'relative w-full bg-white rounded-2xl shadow-2xl border border-slate-100',
          'transform transition-all duration-250 cubic-bezier(0.16, 1, 0.3, 1)',
          'max-h-[92vh] flex flex-col overflow-hidden',
          sizeClasses[size] || sizeClasses.xl,
          isAnimating
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-2 pointer-events-none',
          className
        )}
      >
        {/* Header nếu có title */}
        {(title || !hideCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
            <div>
              {typeof title === 'string' ? (
                <h3 className="text-lg font-bold text-slate-900">{title}</h3>
              ) : (
                title
              )}
              {subtitle && (
                <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
              )}
            </div>
            {!hideCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Nội dung modal */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
