export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  image_upload_url?: string;
  category_id?: string;
  is_available: boolean;
  is_special: boolean;
  allergens?: string[];
  prep_time?: number;
  created_at?: string;
  updated_at?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
}

export interface CartItem {
  id: string;
  menu_item_id: string;
  quantity: number;
  special_requests?: string;
  menu_item?: MenuItem;
}

export interface Cart {
  id: string;
  user_id: string;
  items: CartItem[];
}

export interface Address {
  id: string;
  label?: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  is_default: boolean;
}

export interface Offer {
  id: string;
  code: string;
  title: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount?: number;
  is_active: boolean;
  valid_until?: string;
}

export interface Order {
  id: string;
  order_number: string;
  status: 'placed' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  subtotal: number;
  tax_amount: number;
  delivery_fee: number;
  discount_amount: number;
  total_amount: number;
  delivery_address: Address;
  delivery_type: 'immediate' | 'scheduled';
  scheduled_for?: string;
  payment_method: 'card' | 'paypal' | 'cod';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  special_instructions?: string;
  created_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_requests?: string;
  menu_item?: MenuItem;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name?: string;
  phone?: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'customer' | 'admin' | 'staff';
}