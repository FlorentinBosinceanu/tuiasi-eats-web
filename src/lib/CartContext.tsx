import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: number) => void;
  removeItemCompletely: (id: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
}

// ==========================================
// 2. CREATE CONTEXT
// ==========================================

const CartContext = createContext<CartContextType | undefined>(undefined);

// ==========================================
// 3. CART PROVIDER COMPONENT
// ==========================================

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    // Load cart from localStorage on initial render
    const savedCart = localStorage.getItem('tuiasi_eats_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('tuiasi_eats_cart', JSON.stringify(cart));
  }, [cart]);

  // Add to cart or increase quantity if item exists
  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);

      if (existingItem) {
        // Item exists, increase quantity by 1
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        // Item doesn't exist, add it with quantity 1
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
  };

  // Remove item from cart or decrease quantity
  const removeFromCart = (id: number) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === id);

      if (!existingItem) return prevCart;

      if (existingItem.quantity > 1) {
        // Decrease quantity by 1
        return prevCart.map((cartItem) =>
          cartItem.id === id
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      } else {
        // Remove item from cart if quantity is 1
        return prevCart.filter((cartItem) => cartItem.id !== id);
      }
    });
  };

  // Remove item completely from cart
  const removeItemCompletely = (id: number) => {
    setCart((prevCart) => prevCart.filter((cartItem) => cartItem.id !== id));
  };

  // Clear entire cart
  const clearCart = () => {
    setCart([]);
  };

  // Calculate total price
  const getCartTotal = (): number => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const value: CartContextType = {
    cart,
    addToCart,
    removeFromCart,
    removeItemCompletely,
    clearCart,
    getCartTotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// ==========================================
// 4. CUSTOM HOOK
// ==========================================

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);

  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }

  return context;
};
