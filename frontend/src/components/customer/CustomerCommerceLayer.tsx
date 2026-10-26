'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import type { Order } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { invalidateCatalog } from '@/hooks/useCatalog';
import { CustomerCartModal } from './CustomerCartModal';
import { CustomerCheckoutModal } from './CustomerCheckoutModal';
import { OrderSuccessModal } from './OrderSuccessModal';

/**
 * Lớp mua sắm toàn cục (gắn 1 lần trong RootLayout):
 * Giỏ hàng → Thanh toán → Xác nhận đặt hàng thành công.
 * CHỈ DÀNH CHO KHÁCH HÀNG (Khách vãng lai & User vai trò Customer).
 * Ẩn và vô hiệu hóa hoàn toàn đối với Seller/Admin để không thể đặt hàng như khách.
 */
export const CustomerCommerceLayer: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const { clearCart, setIsCheckoutOpen } = useCart();
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<'COD' | 'ONLINE'>('COD');

  const isSeller = user?.role === 'Seller' || user?.role === 'Admin';

  if (pathname === '/login' || isSeller) return null;

  return (
    <>
      <CustomerCartModal />
      <CustomerCheckoutModal
        onSuccess={async (order, method) => {
          clearCart();
          await invalidateCatalog(); // nạp lại tồn kho ngay lập tức cho mọi component đang mở
          setIsCheckoutOpen(false);
          setPayment(method);
          setPlacedOrder(order);
        }}
      />
      <OrderSuccessModal order={placedOrder} payment={payment} onClose={() => setPlacedOrder(null)} />
    </>
  );
};
