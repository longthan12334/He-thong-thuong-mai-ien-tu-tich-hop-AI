'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import type { Order } from '@/types';
import { useCart } from '@/hooks/useCart';
import { invalidateCatalog } from '@/hooks/useCatalog';
import { CustomerCartModal } from './CustomerCartModal';
import { CustomerCheckoutModal } from './CustomerCheckoutModal';
import { OrderSuccessModal } from './OrderSuccessModal';

/**
 * Lớp mua sắm toàn cục (gắn 1 lần trong RootLayout):
 * Giỏ hàng → Thanh toán → Xác nhận đặt hàng thành công, hoạt động ở mọi trang có Navbar.
 */
export const CustomerCommerceLayer: React.FC = () => {
  const pathname = usePathname();
  const { clearCart, setIsCheckoutOpen } = useCart();
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<'COD' | 'ONLINE'>('COD');

  if (pathname === '/login') return null;

  return (
    <>
      <CustomerCartModal />
      <CustomerCheckoutModal
        onSuccess={(order, method) => {
          clearCart();
          invalidateCatalog(); // tồn kho đã thay đổi sau khi đặt hàng
          setIsCheckoutOpen(false);
          setPayment(method);
          setPlacedOrder(order);
        }}
      />
      <OrderSuccessModal order={placedOrder} payment={payment} onClose={() => setPlacedOrder(null)} />
    </>
  );
};
