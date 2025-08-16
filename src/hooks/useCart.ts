import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CartItem, MenuItem } from '@/types';
import { useAuth } from './useAuth';
import { toast } from '@/components/ui/use-toast';
import { useCartStore } from '@/store/cartStore';

export const useCart = () => {
  const { user, isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { setCartItems: setGlobalCartItems, clearCart: clearGlobalCart } = useCartStore();
  const isMounted = useRef(false);
  const hasClearedCart = useRef(false);

  // Validate localStorage data
  const getValidCartFromStorage = (): CartItem[] => {
    try {
      const storedCart = localStorage.getItem('cart');
      if (!storedCart) return [];
      const parsed = JSON.parse(storedCart);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (item: any) =>
          item &&
          typeof item.id === 'string' &&
          typeof item.menu_item_id === 'string' &&
          typeof item.quantity === 'number' &&
          item.menu_item &&
          typeof item.menu_item.id === 'string' &&
          typeof item.menu_item.name === 'string' &&
          typeof item.menu_item.price === 'number'
      );
    } catch (error) {
      console.error('Error parsing localStorage cart:', error);
      localStorage.removeItem('cart');
      return [];
    }
  };

  // Update global store and localStorage
  const updateCartState = (items: CartItem[]) => {
    setCartItems(items);
    setGlobalCartItems(items);
    localStorage.setItem('cart', JSON.stringify(items));
  };

  // Initialize cart
  useEffect(() => {
    if (isMounted.current) return;
    isMounted.current = true;

    const initializeCart = async () => {
      if (isAuthenticated && user) {
        const storedCart = getValidCartFromStorage();
        updateCartState(storedCart);
        setLoading(true);
        await fetchCart(true);
        setLoading(false);
      } else if (!hasClearedCart.current) {
        hasClearedCart.current = true;
        setCartItems([]);
        localStorage.removeItem('cart');
        clearGlobalCart();
      }
    };

    initializeCart();

    const handleCartCleared = () => {
      if (!isAuthenticated && !hasClearedCart.current) {
        hasClearedCart.current = true;
        setCartItems([]);
        localStorage.removeItem('cart');
        clearGlobalCart();
        console.log('Cart cleared due to unauthenticated state');
      }
    };

    window.addEventListener('cartCleared', handleCartCleared);
    return () => {
      window.removeEventListener('cartCleared', handleCartCleared);
      isMounted.current = false;
      hasClearedCart.current = false;
    };
  }, [user, isAuthenticated, setGlobalCartItems, clearGlobalCart]);

  // Fetch cart from DB
  const fetchCart = async (isInitialLoad: boolean = false) => {
    if (!user) return;

    try {
      let { data: cart, error } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        const { data: newCart, error: newCartError } = await supabase
          .from('carts')
          .insert({ user_id: user.id })
          .select('id')
          .single();
        if (newCartError) throw newCartError;
        cart = newCart;
      } else if (error) {
        throw error;
      }

      if (!cart) throw new Error('Failed to create cart');

      const { data: cartItemsData, error: cartItemsError } = await supabase
        .from('cart_items')
        .select(`
          id,
          menu_item_id,
          quantity,
          special_requests,
          menu_items (
            id,
            name,
            description,
            price,
            image_url,
            is_available
          )
        `)
        .eq('cart_id', cart.id);

      if (cartItemsError) throw cartItemsError;

      const items = cartItemsData
        ? cartItemsData.map((item: any) => ({
            id: item.id,
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            special_requests: item.special_requests,
            menu_item: item.menu_items,
          }))
        : [];

      updateCartState(items);
    } catch (error) {
      console.error('Error fetching cart:', error);
      if (!isInitialLoad || !getValidCartFromStorage().length) {
        toast({
          title: 'Error',
          description: 'Failed to load cart from server. Using local data.',
          variant: 'destructive',
        });
      }
    }
  };

  const addToCart = async (menuItem: MenuItem, quantity: number = 1, specialRequests?: string) => {
    if (!user) {
      toast({
        title: 'Please log in',
        description: 'You need to log in to add items to cart',
        variant: 'destructive',
      });
      setTimeout(() => {
        window.location.href = '/auth';
      }, 2000);
      return;
    }

    try {
      // First, optimistically update the UI
      const existingItemIndex = cartItems.findIndex((item) => item.menu_item_id === menuItem.id);
      let updatedItems: CartItem[];

      if (existingItemIndex >= 0) {
        // Update existing item
        updatedItems = cartItems.map((item, index) =>
          index === existingItemIndex
            ? { 
                ...item, 
                quantity: item.quantity + quantity, 
                special_requests: specialRequests || item.special_requests 
              }
            : item
        );
      } else {
        // Add new item
        const newItem: CartItem = {
          id: `temp-${menuItem.id}-${Date.now()}`, // Temporary ID for optimistic update
          menu_item_id: menuItem.id,
          quantity,
          special_requests: specialRequests,
          menu_item: menuItem,
        };
        updatedItems = [...cartItems, newItem];
      }

      // Update UI immediately
      updateCartState(updatedItems);

      // Then update the database
      let { data: cart, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (cartError) {
        if (cartError.code === 'PGRST116') {
          const { data: newCart, error: newCartError } = await supabase
            .from('carts')
            .insert({ user_id: user.id })
            .select('id')
            .single();
          if (newCartError) throw newCartError;
          cart = newCart;
        } else {
          throw cartError;
        }
      }

      if (!cart) throw new Error('Failed to create cart');

      const { data: existingItem, error: existingItemError } = await supabase
        .from('cart_items')
        .select('id, quantity, special_requests')
        .eq('cart_id', cart.id)
        .eq('menu_item_id', menuItem.id)
        .maybeSingle();

      if (existingItemError) throw existingItemError;

      let dbError = null;
      if (existingItem) {
        const { error } = await supabase
          .from('cart_items')
          .update({
            quantity: existingItem.quantity + quantity,
            special_requests: specialRequests || existingItem.special_requests,
          })
          .eq('id', existingItem.id);
        dbError = error;
      } else {
        const { error } = await supabase.from('cart_items').insert({
          cart_id: cart.id,
          menu_item_id: menuItem.id,
          quantity,
          special_requests: specialRequests,
        });
        dbError = error;
      }

      if (dbError) {
        // Revert the optimistic update if DB operation failed
        updateCartState(cartItems);
        toast({
          title: 'Error',
          description: 'Failed to add item to cart. Please try again.',
          variant: 'destructive',
        });
        throw dbError;
      }

      // Fetch the updated cart from DB to sync with actual data
      await fetchCart();
      
      toast({
        title: 'Added to cart!',
        description: `${menuItem.name} has been added to your cart`,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Revert optimistic update on error
      updateCartState(cartItems);
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      return removeFromCart(cartItemId);
    }

    try {
      const prevItems = [...cartItems];
      const updatedItems = cartItems.map((item) =>
        item.id === cartItemId ? { ...item, quantity } : item
      );
      
      updateCartState(updatedItems);

      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', cartItemId);

      if (error) {
        updateCartState(prevItems);
        throw error;
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      const prevItems = [...cartItems];
      const updatedItems = cartItems.filter((item) => item.id !== cartItemId);
      
      updateCartState(updatedItems);

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (error) {
        updateCartState(prevItems);
        throw error;
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      updateCartState([]);

      const { data: cart, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (cartError && cartError.code !== 'PGRST116') throw cartError;

      if (cart) {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('cart_id', cart.id);
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      const storedCart = getValidCartFromStorage();
      updateCartState(storedCart);
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.menu_item?.price || 0) * item.quantity;
    }, 0);
  };

  const getItemCount = () => {
    const uniqueItems = new Set(cartItems.map((item) => item.menu_item.id));
    return uniqueItems.size;
  };

  return {
    cartItems,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getItemCount,
    refetch: fetchCart,
  };
};