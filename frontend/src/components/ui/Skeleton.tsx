import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

/** Component Skeleton cơ bản với hiệu ứng phát sáng Shimmering mượt mà */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-slate-200/80 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent',
        className
      )}
    />
  );
}

/** Khung tải mô phỏng thẻ sản phẩm */
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
      <Skeleton className="h-52 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="pt-2 flex justify-between items-center">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/** Khung tải cho dòng bảng đơn hàng */
export function OrderTableRowSkeleton() {
  return (
    <tr className="border-b border-slate-100">
      <td className="px-4 py-4">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="px-4 py-4">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
          <div className="space-y-1">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <Skeleton className="h-4 w-20" />
      </td>
      <td className="px-4 py-4">
        <Skeleton className="h-6 w-24 rounded-full" />
      </td>
      <td className="px-4 py-4 text-right">
        <div className="flex justify-end gap-1.5">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </td>
    </tr>
  );
}

/** Khung tải cho dòng bảng kho hàng */
export function InventoryTableRowSkeleton() {
  return (
    <tr className="border-b border-slate-100">
      <td className="px-4 py-4">
        <Skeleton className="h-4 w-4 rounded" />
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="px-4 py-4">
        <Skeleton className="h-4 w-20" />
      </td>
      <td className="px-4 py-4">
        <Skeleton className="h-4 w-12" />
      </td>
      <td className="px-4 py-4">
        <Skeleton className="h-6 w-20 rounded-full" />
      </td>
      <td className="px-4 py-4 text-right">
        <Skeleton className="h-8 w-24 rounded-xl ml-auto" />
      </td>
    </tr>
  );
}

/** Khung tải dòng bảng tổng quát */
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-slate-100">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}
