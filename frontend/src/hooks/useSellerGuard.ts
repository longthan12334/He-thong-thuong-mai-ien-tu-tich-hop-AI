'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';
import { useToast } from './useToast';

export function useSellerGuard(fallbackPath: string = '/shop') {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (!token) {
      setIsAuthorized(false);
      router.replace('/login');
      return;
    }

    if (user?.role === 'Customer') {
      setIsAuthorized(false);
      showToast('Khu vực quản trị chỉ dành cho Người bán (Seller) và Quản trị viên sàn.');
      router.replace(fallbackPath);
      return;
    }

    setIsAuthorized(true);
  }, [user, token, isLoading, router, fallbackPath, showToast]);

  return { isAuthorized, isLoading: isLoading || isAuthorized === null };
}
