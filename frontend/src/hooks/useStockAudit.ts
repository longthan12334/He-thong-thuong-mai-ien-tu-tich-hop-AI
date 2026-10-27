'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDate } from '@/lib/utils';
import { STORAGE_KEYS } from '@/lib/constants';

export interface StockAuditEntry {
  id: string;
  timestamp: string;
  productName: string;
  sku: string;
  change: number;
  newStock: number;
  type: 'RESTOCK' | 'ORDER_HOLD' | 'STATUS_CHANGE';
  note: string;
  actor: string;
}

const STORAGE_KEY = STORAGE_KEYS.STOCK_AUDIT || 'AETHELGARD_STOCK_AUDIT_LOG';

export function useStockAudit() {
  const [auditLogs, setAuditLogs] = useState<StockAuditEntry[]>([]);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setAuditLogs(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Lỗi đọc audit logs:', e);
    }
  }, []);

  const addAuditLog = useCallback((entry: Omit<StockAuditEntry, 'id' | 'timestamp'>) => {
    const newEntry: StockAuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: formatDate(new Date(), 'datetime'),
      ...entry,
    };

    setAuditLogs((prev) => {
      const next = [newEntry, ...prev.slice(0, 49)];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Lỗi lưu audit logs:', e);
      }
      return next;
    });
  }, []);

  const clearAuditLogs = useCallback(() => {
    setAuditLogs([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  return {
    auditLogs,
    isAuditModalOpen,
    setIsAuditModalOpen,
    addAuditLog,
    clearAuditLogs,
  };
}
