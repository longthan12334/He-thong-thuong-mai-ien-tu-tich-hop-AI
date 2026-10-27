'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';
import { useToast } from './useToast';

export function useAdminGuard(fallbackPath: string = '/') {
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

    const isAdmin = user?.role === 'Admin' || (user?.role as any) === 1 || String(user?.role).toLowerCase() === 'admin';
    if (!isAdmin) {
      setIsAuthorized(false);
      showToast('Khu vực này yêu cầu đặc quyền Quản trị viên điều hành sàn (Admin).');
      router.replace(fallbackPath);
      return;
    }

    setIsAuthorized(true);
  }, [user, token, isLoading, router, fallbackPath, showToast]);

  return { isAuthorized, isLoading: isLoading || isAuthorized === null };
}
