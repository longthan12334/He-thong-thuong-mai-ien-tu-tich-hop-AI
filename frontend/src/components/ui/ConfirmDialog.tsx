'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { AlertTriangle, Info } from 'lucide-react';

export type ConfirmOptions = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: 'danger' | 'default';
};

type ConfirmState = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmState | null>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (state) {
      setIsRendered(true);
      const timer = requestAnimationFrame(() => setIsAnimating(true));
      return () => cancelAnimationFrame(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsRendered(false), 200);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({
        confirmText: 'Xác nhận',
        cancelText: 'Hủy',
        tone: 'default',
        ...options,
        resolve,
      });
    });
  }, []);

  const close = useCallback((value: boolean) => {
    setIsAnimating(false);
    setTimeout(() => {
      setState((current) => {
        current?.resolve(value);
        return null;
      });
    }, 200);
  }, []);

  const dialog = isRendered && state ? (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-200 ${
        isAnimating ? 'bg-slate-950/60 opacity-100' : 'bg-slate-950/0 opacity-0 pointer-events-none'
      }`}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className={`w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all duration-200 transform ${
          isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-2'
        }`}
      >
        <div className="flex gap-4 items-start mb-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              state.tone === 'danger'
                ? 'bg-rose-50 text-rose-600 border border-rose-100'
                : 'bg-sky-50 text-sky-600 border border-sky-100'
            }`}
          >
            {state.tone === 'danger' ? (
              <AlertTriangle className="h-6 w-6" />
            ) : (
              <Info className="h-6 w-6" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 id="confirm-dialog-title" className="text-lg font-bold text-slate-900 mb-1">
              {state.title}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">{state.message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => close(false)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {state.cancelText}
          </button>
          <button
            type="button"
            onClick={() => close(true)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition-all cursor-pointer ${
              state.tone === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'
                : 'bg-sky-500 hover:bg-sky-600 shadow-sky-100'
            }`}
          >
            {state.confirmText}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, confirmDialog: dialog };
}

export default useConfirmDialog;
