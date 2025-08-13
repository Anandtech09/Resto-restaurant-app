import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Package, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { MenuItem, MenuCategory, Order } from '@/types';

// --- TYPE DEFINITIONS ---
interface Offer {
  id: string;
  title: string;
  description: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  valid_from: string;
  valid_until: string;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

interface AdminOrder extends Omit<Order, 'order_items'> {
  user_id: string;
  order_items: {
    quantity: number;
    menu_items: { name: string };
  }[];
}

interface BannerSettings {
  id: string;
  image_url?: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  is_active: boolean;
}

const ORDER_STATUSES: Order['status'][] = [
  'placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled',
];

const initialNewOfferState = {
  title: '',
  description: '',
  code: '',
  discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: '',
  min_order_amount: '',
  valid_from: '',
  valid_until: '',
  usage_limit: '',
  is_active: true,
};

// --- COMPONENT ---
export const Admin = () => {
  const { user, loading: authLoading } = useAuth();

  // State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [bannerSettings, setBannerSettings] = useState<BannerSettings | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBanner, setEditingBanner] = useState(false);
  const [activeTab, setActiveTab] = useState('orders'); // Manage active tab explicitly

  const navigate = useNavigate();

  // Form States
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
    is_available: true,
    is_special: false,
    prep_time: '',
  });
  const [newBanner, setNewBanner] = useState({
    title: '',
    subtitle: '',
    button_text: '',
    button_link: '',
    image_url: '',
  });
  const [newOffer, setNewOffer] = useState(initialNewOfferState);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [authLoading, user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading || authLoading) {
        setShowError(true);
      }
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, [loading, authLoading]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, categoriesRes, bannerRes, ordersRes, offersRes] = await Promise.all([
        supabase.from('menu_items').select('*').order('created_at', { ascending: false }),
        supabase.from('menu_categories').select('*').order('sort_order'),
        supabase.from('banner_settings').select('*').eq('is_active', true).limit(1).maybeSingle(),
        supabase.from('orders').select('*, order_items(quantity, menu_items(name))').order('created_at', { ascending: false }),
        supabase.from('offers').select('*').order('created_at', { ascending: false }),
      ]);

      if (itemsRes.error) throw itemsRes.error;
      setMenuItems(itemsRes.data || []);

      if (categoriesRes.error) throw categoriesRes.error;
      setCategories(categoriesRes.data || []);

      if (bannerRes.data) {
        setBannerSettings(bannerRes.data);
        setNewBanner({
          title: bannerRes.data.title || '',
          subtitle: bannerRes.data.subtitle || '',
          button_text: bannerRes.data.button_text || '',
          button_link: bannerRes.data.button_link || '',
          image_url: bannerRes.data.image_url || '',
        });
      }

      if (ordersRes.error) throw ordersRes.error;
      setOrders(ordersRes.data as AdminOrder[] || []);

      if (offersRes.error) throw offersRes.error;
      setOffers(offersRes.data || []);
    } catch (error: any) {
      toast({ title: 'Error Fetching Data', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER FUNCTIONS ---
  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.category_id) {
      toast({
        title: 'Validation Error',
        description: 'Name, price, and category are required.',
        variant: 'destructive',
      });
      return;
    }
    if (isNaN(parseFloat(newItem.price)) || parseFloat(newItem.price) <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Price must be a valid number greater than 0.',
        variant: 'destructive',
      });
      return;
    }
    try {
      const { error } = await supabase.from('menu_items').insert({
        name: newItem.name,
        description: newItem.description,
        price: parseFloat(newItem.price),
        category_id: newItem.category_id,
        image_url: newItem.image_url || null,
        is_available: newItem.is_available,
        is_special: newItem.is_special,
        prep_time: newItem.prep_time ? parseInt(newItem.prep_time) : null,
      }).select();
      if (error) throw error;
      toast({
        title: 'Success',
        description: 'Menu item added successfully!',
        className: 'bg-green-600 text-white animate-gold-shimmer',
      });
      setNewItem({
        name: '',
        description: '',
        price: '',
        category_id: '',
        image_url: '',
        is_available: true,
        is_special: false,
        prep_time: '',
      });
      await fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: `Could not add item: ${error.message}`, variant: 'destructive' });
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
      toast({
        title: 'Success',
        description: 'Menu item deleted successfully.',
        className: 'bg-green-600 text-white animate-gold-shimmer',
      });
      await fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: `Could not delete item: ${error.message}`, variant: 'destructive' });
    }
  };

  const handleAddOffer = async () => {
    if (!newOffer.title || !newOffer.code || !newOffer.discount_value || !newOffer.valid_from || !newOffer.valid_until) {
      toast({
        title: 'Validation Error',
        description: 'Title, Code, Discount Value, Valid From, and Valid Until are required.',
        variant: 'destructive',
      });
      return;
    }
    if (isNaN(parseFloat(newOffer.discount_value)) || parseFloat(newOffer.discount_value) <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Discount Value must be a valid number greater than 0.',
        variant: 'destructive',
      });
      return;
    }
    if (newOffer.min_order_amount && isNaN(parseFloat(newOffer.min_order_amount))) {
      toast({
        title: 'Validation Error',
        description: 'Minimum Order Amount must be a valid number.',
        variant: 'destructive',
      });
      return;
    }
    try {
      const { error } = await supabase.from('offers').insert({
        ...newOffer,
        discount_value: parseFloat(newOffer.discount_value),
        min_order_amount: parseFloat(newOffer.min_order_amount) || 0,
        usage_limit: newOffer.usage_limit ? parseInt(newOffer.usage_limit) : null,
      });
      if (error) throw error;
      toast({
        title: 'Success',
        description: 'New offer added successfully!',
        className: 'bg-green-600 text-white animate-gold-shimmer',
      });
      setNewOffer(initialNewOfferState);
      await fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: `Could not add offer: ${error.message}`, variant: 'destructive' });
    }
  };

  const handleDeleteOffer = async (id: string) => {
    try {
      const { error } = await supabase.from('offers').delete().eq('id', id);
      if (error) throw error;
      toast({
        title: 'Success',
        description: 'Offer deleted successfully.',
        className: 'bg-green-600 text-white animate-gold-shimmer',
      });
      await fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: `Could not delete offer: ${error.message}`, variant: 'destructive' });
    }
  };

  const handleUpdateBanner = async () => {
    if (!newBanner.title || !newBanner.button_text || !newBanner.button_link) {
      toast({
        title: 'Validation Error',
        description: 'Title, Button Text, and Button Link are required.',
        variant: 'destructive',
      });
      return;
    }
    try {
      if (bannerSettings) {
        const { error } = await supabase.from('banner_settings').update({ ...newBanner }).eq('id', bannerSettings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('banner_settings').insert({ ...newBanner, is_active: true });
        if (error) throw error;
      }
      toast({
        title: 'Success',
        description: 'Banner updated successfully!',
        className: 'bg-green-600 text-white animate-gold-shimmer',
      });
      setEditingBanner(false);
      await fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: `Could not update banner: ${error.message}`, variant: 'destructive' });
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (error) throw error;
      toast({
        title: 'Success',
        description: `Order status updated to ${newStatus}.`,
        className: 'bg-green-600 text-white animate-gold-shimmer',
      });
      setOrders(currentOrders =>
        currentOrders.map(o => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (error: any) {
      toast({ title: 'Error', description: `Could not update status: ${error.message}`, variant: 'destructive' });
    }
  };


  if (loading || authLoading) {
    if (showError) {
      return (
        <div className="min-h-screen bg-background pt-6">
          <Header />
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <p className="text-muted-foreground font-display font-bold">
                Data is not loaded from database, may be due to unauthorized access.
                If not logged in, please log in to access the admin panel.
              </p>
              <Button onClick={() => navigate('/auth')} className="mt-4">
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background pt-6">
        <Header />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4" />
            <p className="text-muted-foreground font-display">Loading Admin Panel...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-6">
      <Header />
      <div className="container mx-auto px-4">
        <h1 className="font-display mt-3 text-4xl font-bold text-coffee mb-6 animate-fade-up">Admin Panel</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gradient-card shadow-coffee">
            <TabsTrigger value="orders" className="font-display text-coffee">Order Management</TabsTrigger>
            <TabsTrigger value="offers" className="font-display text-coffee">Offer Management</TabsTrigger>
            <TabsTrigger value="menu" className="font-display text-coffee">Menu Management</TabsTrigger>
            <TabsTrigger value="banner" className="font-display text-coffee">Banner Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            <Card className="shadow-coffee">
              <CardHeader>
                <CardTitle className="font-display text-xl text-coffee">Manage All Customer Orders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map(order => (
                      <Card key={order.id} className="p-4 shadow-coffee">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <p className="font-display font-semibold text-coffee">Order #{order.order_number}</p>
                            <p className="text-sm text-muted-foreground">
                              <strong>User ID:</strong>
                              <span className="font-mono text-xs ml-2 p-1 bg-muted rounded">{order.user_id}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <strong>DELIVERY EMAIL:</strong>
                              <span className="font-mono text-xs ml-2 p-1 bg-muted rounded">{order.delivery_address.label}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <strong>DELIVERY ADDRESS:</strong>
                              <span className="font-mono text-xs ml-2 p-1 bg-muted rounded">
                                {`${order.delivery_address.street_address}, ${order.delivery_address.city}, ${order.delivery_address.state}, ${order.delivery_address.zip_code}`}
                              </span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <strong>Date:</strong> {new Date(order.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label className="font-display text-coffee">Summary</Label>
                            <p className="text-lg font-bold text-gold">${order.total_amount.toFixed(2)}</p>
                            <ul className="text-sm text-muted-foreground">
                              {order.order_items.map((item, index) => (
                                <li key={index}>
                                  {item.quantity}x {item.menu_items?.name || 'Unknown Item'}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="flex items-center space-x-2 justify-self-start md:justify-self-end">
                            <Label htmlFor={`status-${order.id}`} className="font-display text-coffee">Status:</Label>
                            <Select
                              value={order.status}
                              onValueChange={(newStatus) => handleUpdateOrderStatus(order.id, newStatus as Order['status'])}
                            >
                              <SelectTrigger id={`status-${order.id}`} className="w-[180px] bg-background border-gold">
                                <SelectValue placeholder="Update status" />
                              </SelectTrigger>
                              <SelectContent>
                                {ORDER_STATUSES.map(status => (
                                  <SelectItem key={status} value={status}>
                                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4" />
                    <p className="font-display">No orders found.</p>
                    <p className="text-sm">May this issue occured that you not set your address in profile</p>
                    <p className="text-sm">Please set your address in profile</p>
                    <button className='text-sm text-coffee hover:underline' onClick={() => router.push('/profile')}>Set Address</button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="offers" className="space-y-6">
            <Card className="shadow-coffee">
              <CardHeader>
                <CardTitle className="font-display text-xl text-coffee flex items-center">
                  <Tag className="h-5 w-5 mr-2" />
                  Add New Offer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="offer-title" className="font-display text-coffee">Title</Label>
                    <Input
                      id="offer-title"
                      value={newOffer.title}
                      onChange={(e) => setNewOffer({ ...newOffer, title: e.target.value })}
                      placeholder="e.g. Weekend Special"
                      className="border-gold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="offer-code" className="font-display text-coffee">Promo Code</Label>
                    <Input
                      id="offer-code"
                      value={newOffer.code}
                      onChange={(e) => setNewOffer({ ...newOffer, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. WEEKEND20"
                      className="border-gold"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="offer-desc" className="font-display text-coffee">Description</Label>
                  <Textarea
                    id="offer-desc"
                    value={newOffer.description}
                    onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
                    placeholder="Describe the offer"
                    className="border-gold"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="font-display text-coffee">Discount Type</Label>
                    <Select
                      value={newOffer.discount_type}
                      onValueChange={(v) => setNewOffer({ ...newOffer, discount_type: v as any })}
                    >
                      <SelectTrigger className="border-gold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="offer-value" className="font-display text-coffee">Discount Value</Label>
                    <Input
                      id="offer-value"
                      type="number"
                      value={newOffer.discount_value}
                      onChange={(e) => setNewOffer({ ...newOffer, discount_value: e.target.value })}
                      placeholder="e.g. 20 or 5"
                      className="border-gold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="offer-min" className="font-display text-coffee">Min. Order Amount ($)</Label>
                    <Input
                      id="offer-min"
                      type="number"
                      value={newOffer.min_order_amount}
                      onChange={(e) => setNewOffer({ ...newOffer, min_order_amount: e.target.value })}
                      placeholder="e.g. 50"
                      className="border-gold"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="offer-from" className="font-display text-coffee">Valid From</Label>
                    <Input
                      id="offer-from"
                      type="date"
                      value={newOffer.valid_from}
                      onChange={(e) => setNewOffer({ ...newOffer, valid_from: e.target.value })}
                      className="border-gold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="offer-until" className="font-display text-coffee">Valid Until</Label>
                    <Input
                      id="offer-until"
                      type="date"
                      value={newOffer.valid_until}
                      onChange={(e) => setNewOffer({ ...newOffer, valid_until: e.target.value })}
                      className="border-gold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="offer-limit" className="font-display text-coffee">Usage Limit</Label>
                    <Input
                      id="offer-limit"
                      type="number"
                      value={newOffer.usage_limit}
                      onChange={(e) => setNewOffer({ ...newOffer, usage_limit: e.target.value })}
                      placeholder="Leave blank for unlimited"
                      className="border-gold"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="offer-active"
                    checked={newOffer.is_active}
                    onCheckedChange={(c) => setNewOffer({ ...newOffer, is_active: c })}
                  />
                  <Label htmlFor="offer-active" className="font-display text-coffee">Activate Offer</Label>
                </div>
                <Button onClick={handleAddOffer} className="btn-coffee animate-gold-shimmer">
                  <Plus className="mr-2 h-4 w-4" /> Add Offer
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-coffee">
              <CardHeader>
                <CardTitle className="font-display text-xl text-coffee">Existing Offers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {offers.length > 0 ? (
                    offers.map(offer => (
                      <div key={offer.id} className="border border-gold p-4 rounded-lg flex justify-between items-center bg-gradient-card">
                        <div>
                          <p className="font-display font-bold text-lg text-coffee flex items-center gap-2">
                            {offer.title} <Badge className="bg-gold text-coffee">{offer.code}</Badge>
                            {offer.is_active ? (
                              <Badge className="bg-green-600 text-white">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">{offer.description}</p>
                          <p className="text-sm font-display text-coffee">
                            Discount: <strong>{offer.discount_type === 'percentage' ? `${offer.discount_value}%` : `$${offer.discount_value}`}</strong> on orders over ${offer.min_order_amount}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Valid: {new Date(offer.valid_from).toLocaleDateString()} to {new Date(offer.valid_until).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Usage: {offer.used_count} / {offer.usage_limit || '∞'}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteOffer(offer.id)}
                          className="hover:bg-destructive/80"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center font-display">No offers found.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="menu" className="space-y-6">
            <Card className="shadow-coffee">
              <CardHeader>
                <CardTitle className="font-display text-xl text-coffee">Add New Menu Item</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="item-name" className="font-display text-coffee">Name</Label>
                    <Input
                      id="item-name"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      placeholder="Item name"
                      className="border-gold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-price" className="font-display text-coffee">Price</Label>
                    <Input
                      id="item-price"
                      type="number"
                      step="0.01"
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                      placeholder="0.00"
                      className="border-gold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-category" className="font-display text-coffee">Category</Label>
                    <Select
                      value={newItem.category_id}
                      onValueChange={(value) => setNewItem({ ...newItem, category_id: value })}
                    >
                      <SelectTrigger className="border-gold">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-prep-time" className="font-display text-coffee">Prep Time (minutes)</Label>
                    <Input
                      id="item-prep-time"
                      type="number"
                      value={newItem.prep_time}
                      onChange={(e) => setNewItem({ ...newItem, prep_time: e.target.value })}
                      placeholder="15"
                      className="border-gold"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-description" className="font-display text-coffee">Description</Label>
                  <Textarea
                    id="item-description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Item description"
                    className="border-gold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-image-url" className="font-display text-coffee">Image URL</Label>
                  <Input
                    id="item-image-url"
                    value={newItem.image_url}
                    onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="border-gold"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="item-available"
                      checked={newItem.is_available}
                      onCheckedChange={(checked) => setNewItem({ ...newItem, is_available: checked })}
                    />
                    <Label htmlFor="item-available" className="font-display text-coffee">Available</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="item-special"
                      checked={newItem.is_special}
                      onCheckedChange={(checked) => setNewItem({ ...newItem, is_special: checked })}
                    />
                    <Label htmlFor="item-special" className="font-display text-coffee">Special Item</Label>
                  </div>
                </div>
                <Button onClick={handleAddItem} className="btn-coffee animate-gold-shimmer">
                  <Plus className="h-4 w-4 mr-2" /> Add Menu Item
                </Button>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map((item) => (
                <Card key={item.id} className="shadow-coffee">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display font-semibold text-coffee">{item.name}</h3>
                        <div className="flex gap-1">
                          {item.is_special && <Badge className="bg-gold text-coffee">Special</Badge>}
                          {!item.is_available && <Badge variant="destructive">Unavailable</Badge>}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <p className="font-display font-bold text-gold">${item.price.toFixed(2)}</p>
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-32 object-cover rounded"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                          className="hover:bg-destructive/80"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="banner" className="space-y-6">
            <Card className="shadow-coffee">
              <CardHeader>
                <CardTitle className="font-display text-xl text-coffee flex items-center justify-between">
                  Landing Page Banner
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingBanner(!editingBanner)}
                    className="border-gold hover:bg-gold/10 animate-scale-in"
                  >
                    {editingBanner ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingBanner ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="banner-title" className="font-display text-coffee">Title</Label>
                        <Input
                          id="banner-title"
                          value={newBanner.title}
                          onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                          placeholder="Banner title"
                          className="border-gold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="banner-subtitle" className="font-display text-coffee">Subtitle</Label>
                        <Input
                          id="banner-subtitle"
                          value={newBanner.subtitle}
                          onChange={(e) => setNewBanner({ ...newBanner, subtitle: e.target.value })}
                          placeholder="Banner subtitle"
                          className="border-gold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="banner-button-text" className="font-display text-coffee">Button Text</Label>
                        <Input
                          id="banner-button-text"
                          value={newBanner.button_text}
                          onChange={(e) => setNewBanner({ ...newBanner, button_text: e.target.value })}
                          placeholder="Button text"
                          className="border-gold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="banner-button-link" className="font-display text-coffee">Button Link</Label>
                        <Input
                          id="banner-button-link"
                          value={newBanner.button_link}
                          onChange={(e) => setNewBanner({ ...newBanner, button_link: e.target.value })}
                          placeholder="/menu"
                          className="border-gold"
                        />
                      </div>
                    </div>
                    {/* <div className="space-y-2">
                      <Label htmlFor="banner-image-url" className="font-display text-coffee">Background Image URL</Label>
                      <Input
                        id="banner-image-url"
                        value={newBanner.image_url}
                        onChange={(e) => setNewBanner({ ...newBanner, image_url: e.target.value })}
                        placeholder="https://example.com/banner.jpg"
                        className="border-gold"
                      />
                    </div> */}
                    <div className="flex gap-2">
                      <Button onClick={handleUpdateBanner} className="btn-coffee animate-gold-shimmer">
                        <Save className="h-4 w-4 mr-2" /> Save Banner
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingBanner(false)}
                        className="border-gold hover:bg-gold/10 animate-scale-in"
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <p className="font-display text-coffee">
                      <strong>Title:</strong> {bannerSettings?.title || 'Not set'}
                    </p>
                    <p className="font-display text-coffee">
                      <strong>Subtitle:</strong> {bannerSettings?.subtitle || 'Not set'}
                    </p>
                    <p className="font-display text-coffee">
                      <strong>Button:</strong> {bannerSettings?.button_text || 'Not set'} → {bannerSettings?.button_link || 'Not set'}
                    </p>
                    {/* <p className="font-display text-coffee">
                      <strong>Background Image:</strong> {bannerSettings?.image_url ? 'Set' : 'Not set'}
                    </p> */}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};