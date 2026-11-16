import type { Metadata } from 'next';
import './globals.css';
import '@/styles/style.css';
import '@/styles/inventory.css';
import '@/styles/orders.css';
import '@/styles/income-statistics.css';
import '@/styles/shop-profile.css';
import '@/styles/profile-shoppe.css';
import '@/styles/login-sketch.css';
import '@/styles/customer.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { CartProvider } from '@/contexts/CartContext';
import { ShopperProvider } from '@/contexts/ShopperContext';
import { CustomerCommerceLayer } from '@/components/customer/CustomerCommerceLayer';

export const metadata: Metadata = {
  title: 'Aethelgard Mall — Sàn Thời Trang Cao Cấp Tích Hợp AI',
  description: 'Sàn thương mại điện tử thời trang & sneaker cao cấp tích hợp AI thông minh',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-white text-slate-900 antialiased selection:bg-sky-500 selection:text-white">
        <AuthProvider>
          <ToastProvider>
            <CartProvider>
              <ShopperProvider>
                <Navbar />
                <div className="flex-1">{children}</div>
                <Footer />
                {/* Giỏ hàng → Thanh toán → Đặt hàng thành công: dùng chung mọi trang */}
                <CustomerCommerceLayer />
              </ShopperProvider>
            </CartProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

