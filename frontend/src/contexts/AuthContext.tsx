'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { STORAGE_KEYS } from '@/lib/constants';
import type { AuthUser } from '@/types';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Khôi phục trạng thái đăng nhập từ localStorage khi khởi động
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const storedUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER);

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        const parsed = JSON.parse(storedUser);
        if (parsed && !parsed.id && parsed.userId) parsed.id = parsed.userId;
        setUser(parsed);
      } catch {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
      }
    }
    setIsLoading(false);
  }, []);

  const isLoginPage = pathname === '/login';

  // Khu mua sắm công khai: cho phép xem danh mục sản phẩm & tra cứu đơn hàng
  const isPublicShopperPage =
    pathname === '/shop' ||
    pathname.startsWith('/shop/track-order') ||
    pathname.startsWith('/shop/wishlist') ||
    pathname.startsWith('/product-detail');

  // Trang nghiệp vụ dành riêng cho Seller hoặc Admin
  const isSellerAdminOnlyPage =
    pathname === '/inventory' ||
    pathname === '/orders' ||
    pathname === '/income-statistics' ||
    pathname === '/vouchers' ||
    pathname === '/transactions' ||
    pathname === '/shop-profile' ||
    pathname.startsWith('/seller') ||
    pathname.startsWith('/admin');

  // Bảo vệ trang: Mặc định chưa đăng nhập thì tự động chuyển về /login
  useEffect(() => {
    if (isLoading) return;

    // 1. Chưa đăng nhập: Mặc định chuyển hướng về /login (trừ khi đang ở /login hoặc trang mua sắm công khai)
    if (!token && !isLoginPage && !isPublicShopperPage) {
      sessionStorage.setItem(STORAGE_KEYS.REDIRECT_PATH, pathname);
      router.replace('/login');
      return;
    }

    // 2. Tài khoản Customer cố truy cập trang Seller/Admin hoặc Showroom nội bộ -> chuyển về /shop
    if (token && user?.role === 'Customer' && (isSellerAdminOnlyPage || pathname === '/')) {
      router.replace(pathname === '/orders' ? '/shop/my-orders' : '/shop');
      return;
    }

    // 3. Tài khoản Seller cố truy cập trang /admin -> chuyển về trang chính /
    if (token && user?.role === 'Seller' && pathname.startsWith('/admin')) {
      router.replace('/');
      return;
    }

    // 4. Đã đăng nhập nhưng đang ở /login -> chuyển về trang mặc định theo vai trò
    if (token && isLoginPage) {
      const saved = sessionStorage.getItem(STORAGE_KEYS.REDIRECT_PATH);
      const isCustomer = user?.role === 'Customer';
      const isAdmin = user?.role === 'Admin';
      const defaultPath = isAdmin ? '/admin' : isCustomer ? '/shop' : '/';
      const isInvalidForCustomer = isCustomer && (!saved || saved === '/' || saved === '/login' || isSellerAdminOnlyPage);
      const redirect = isInvalidForCustomer ? defaultPath : (saved || defaultPath);
      sessionStorage.removeItem(STORAGE_KEYS.REDIRECT_PATH);
      router.replace(redirect);
    }
  }, [token, isLoading, pathname, router, user, isLoginPage, isPublicShopperPage, isSellerAdminOnlyPage]);

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    const userWithId = { ...newUser, id: newUser.id ?? newUser.userId };
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newToken);
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(userWithId));
    setToken(newToken);
    setUser(userWithId);

    const isCustomer = newUser.role === 'Customer';
    const isAdmin = newUser.role === 'Admin';
    const defaultPath = isAdmin ? '/admin' : isCustomer ? '/shop' : '/';
    const saved = sessionStorage.getItem(STORAGE_KEYS.REDIRECT_PATH);
    const isInvalidSaved = !saved || saved === '/' || saved === '/login' || (isCustomer && (saved === '/' || saved.startsWith('/inventory') || saved.startsWith('/orders') || saved.startsWith('/income')));
    const redirect = isInvalidSaved ? defaultPath : saved;
    sessionStorage.removeItem(STORAGE_KEYS.REDIRECT_PATH);
    router.replace(redirect);
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    sessionStorage.removeItem(STORAGE_KEYS.REDIRECT_PATH);
    setToken(null);
    setUser(null);
    router.replace('/login');
  }, [router]);

  // Cho phép render nếu: đang ở /login HOẶC ở trang mua sắm công khai HOẶC đã có token đăng nhập
  const canRender = !isLoading && (isLoginPage || isPublicShopperPage || !!token);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token,
      isLoading,
      login,
      logout,
    }}>
      {canRender ? children : (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
          flexDirection: 'column',
          gap: '1.25rem',
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            border: '3px solid #f1f5f9',
            borderTop: '3px solid #0284c7',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#0f172a', fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>
              Aethelgard
            </p>
            <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '4px' }}>
              Đang xác thực phiên đăng nhập...
            </p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong <AuthProvider>');
  }
  return context;
}
