import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CartItem, MenuItem } from '@/types';
import { useAuth } from './useAuth';
import { toast } from '@/components/ui/use-toast';

export const useCart = () => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: cart } = await supabase
        .from('carts')
        .select(`
          id,
          cart_items (
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
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (cart?.cart_items) {
        const items = cart.cart_items.map((item: any) => ({
          id: item.id,
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          special_requests: item.special_requests,
          menu_item: item.menu_items
        }));
        setCartItems(items);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (menuItem: MenuItem, quantity: number = 1, specialRequests?: string) => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to log in to add items to cart",
        variant: "destructive"
      });

      setTimeout(() => {
        window.location.href = '/auth';
      }, 2000);

      return;
    }

    try {
      // First, ensure user has a cart
      let { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!cart) {
        const { data: newCart } = await supabase
          .from('carts')
          .insert({ user_id: user.id })
          .select('id')
          .single();
        cart = newCart;
      }

      if (!cart) throw new Error('Failed to create cart');

      // Check if item already exists in cart
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cart.id)
        .eq('menu_item_id', menuItem.id)
        .single();

      if (existingItem) {
        // Update quantity
        await supabase
          .from('cart_items')
          .update({ 
            quantity: existingItem.quantity + quantity,
            special_requests: specialRequests
          })
          .eq('id', existingItem.id);
      } else {
        // Add new item
        await supabase
          .from('cart_items')
          .insert({
            cart_id: cart.id,
            menu_item_id: menuItem.id,
            quantity,
            special_requests: specialRequests
          });
      }

      await fetchCart();
      toast({
        title: "Added to cart!",
        description: `${menuItem.name} has been added to your cart`,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive"
      });
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      return removeFromCart(cartItemId);
    }

    try {
      await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', cartItemId);

      await fetchCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive"
      });
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      await fetchCart();
      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart",
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive"
      });
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      const { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (cart) {
        await supabase
          .from('cart_items')
          .delete()
          .eq('cart_id', cart.id);
      }

      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.menu_item?.price || 0) * item.quantity;
    }, 0);
  };

  const getItemCount = () => {
    const uniqueItems = new Set(cartItems.map(item => item.menu_item.id));
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
    refetch: fetchCart
  };
};