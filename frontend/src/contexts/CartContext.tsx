import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { CartItem, Product, ProductColor, ProductSize } from '../utils/types';
import { storage } from '../utils/helpers';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity: number, color?: ProductColor, size?: ProductSize) => void;
  removeItem: (productId: string, colorId?: string, sizeId?: string) => void;
  updateQuantity: (productId: string, quantity: number, colorId?: string, sizeId?: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  itemCount: 0,
  subtotal: 0,
});

function getItemKey(productId: string, colorId?: string, sizeId?: string): string {
  return `${productId}-${colorId || 'none'}-${sizeId || 'none'}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => storage.getCart());

  useEffect(() => {
    storage.setCart(items);
  }, [items]);

  const addItem = useCallback((product: Product, quantity: number, color?: ProductColor, size?: ProductSize) => {
    setItems(prev => {
      const key = getItemKey(product.id, color?.id, size?.id);
      const existingIndex = prev.findIndex(
        item => getItemKey(item.product.id, item.selectedColor?.id, item.selectedSize?.id) === key
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }

      return [...prev, { product, quantity, selectedColor: color, selectedSize: size }];
    });
  }, []);

  const removeItem = useCallback((productId: string, colorId?: string, sizeId?: string) => {
    const key = getItemKey(productId, colorId, sizeId);
    setItems(prev => prev.filter(
      item => getItemKey(item.product.id, item.selectedColor?.id, item.selectedSize?.id) !== key
    ));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, colorId?: string, sizeId?: string) => {
    if (quantity < 1) return;
    const key = getItemKey(productId, colorId, sizeId);
    setItems(prev => prev.map(item =>
      getItemKey(item.product.id, item.selectedColor?.id, item.selectedSize?.id) === key
        ? { ...item, quantity }
        : item
    ));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
