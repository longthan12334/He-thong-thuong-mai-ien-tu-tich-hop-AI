'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useShopper } from '@/contexts/ShopperContext';

/** Thanh điều hướng phụ của khu mua sắm — dạng tab phân đoạn đồng bộ với Navbar */
export const ShopSubnav: React.FC = () => {
  const pathname = usePathname();
  const { token, user } = useAuth();
  const { wishlist } = useShopper();
  const isSeller = user?.role === 'Seller' || user?.role === 'Admin';

  const links = isSeller
    ? [
        { href: '/shop', label: '👁 Góc Người Mua (Xem Trước)' },
        { href: '/inventory', label: '📦 Quay Lại Tồn Kho' },
        { href: '/orders', label: '📋 Quản Lý Đơn Hàng' },
      ]
    : [
        { href: '/shop', label: 'Mua Sắm' },
        { href: '/shop/wishlist', label: `Yêu Thích${wishlist.length ? ` (${wishlist.length})` : ''}` },
        ...(token ? [{ href: '/shop/my-orders', label: 'Đơn Hàng Của Tôi' }] : []),
        { href: '/shop/track-order', label: 'Tra Cứu Đơn' },
      ];

  return (
    <nav className="customer-subnav" aria-label="Điều hướng khu mua sắm">
      {links.map((l) => {
        const active = l.href === '/shop' ? pathname === '/shop' : pathname.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} className={`customer-subnav-link ${active ? 'active' : ''}`}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
};
