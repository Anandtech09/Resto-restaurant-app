import { create } from 'zustand';
import { CartItem } from '@/types';

interface CartStore {
  cartItemCount: number;
  setCartItems: (items: CartItem[]) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>((set) => ({
  cartItemCount: 0,
  setCartItems: (items: CartItem[]) => {
    const uniqueItems = new Set(items.map((item) => item.menu_item.id));
    set({ cartItemCount: uniqueItems.size });
  },
  clearCart: () => set({ cartItemCount: 0 }),
}));