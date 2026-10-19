'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Product } from '@/types';

export interface CartItem {
  product: Product;
  quantity: number;
  specs?: string;
}

interface CartContextType {
  cart: CartItem[];
  totalQty: number;
  totalAmount: number;
  addToCart: (product: Product, quantity?: number, specs?: string) => void;
  removeFromCart: (productId: number, specs?: string) => void;
  updateQuantity: (productId: number, quantity: number, specs?: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
}

const CART_STORAGE_KEY = 'aethelgard_cart';

/**
 * Mỗi dòng giỏ hàng được nhận diện bằng (productId + phân loại).
 * Cùng 1 sản phẩm nhưng khác size/màu sẽ là 2 dòng riêng biệt.
 * Khi không truyền specs, các hàm remove/update tác động lên mọi dòng của sản phẩm đó
 * (giữ tương thích với code cũ chỉ truyền productId).
 */
const normalizeSpecs = (specs?: string) => (specs || 'Tiêu chuẩn').trim();
const isSameLine = (item: CartItem, productId: number, specs?: string) =>
  item.product.id === productId &&
  (specs === undefined || normalizeSpecs(item.specs) === normalizeSpecs(specs));

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Khôi phục giỏ hàng từ localStorage khi khởi động
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setCart(JSON.parse(stored));
      }
    } catch {
      // Bỏ qua lỗi parse
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Lưu giỏ hàng vào localStorage khi có thay đổi
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      } catch {
        // Bỏ qua lỗi quota
      }
    }
  }, [cart, isLoaded]);

  const addToCart = useCallback((product: Product, quantity = 1, specs?: string) => {
    const lineSpecs = normalizeSpecs(specs);
    setCart((prev) => {
      const index = prev.findIndex((item) => isSameLine(item, product.id, lineSpecs));
      if (index > -1) {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          product,
          quantity: updated[index].quantity + quantity,
        };
        return updated;
      }
      return [...prev, { product, quantity, specs: lineSpecs }];
    });
  }, []);

  const removeFromCart = useCallback((productId: number, specs?: string) => {
    setCart((prev) => prev.filter((item) => !isSameLine(item, productId, specs)));
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number, specs?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, specs);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        isSameLine(item, productId, specs) ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const totalQty = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.product.basePrice || 0) * item.quantity, 0);
  }, [cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        totalQty,
        totalAmount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart phải được sử dụng bên trong <CartProvider>');
  }
  return context;
};

