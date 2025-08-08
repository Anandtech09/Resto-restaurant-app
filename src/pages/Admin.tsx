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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
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
  const [offers, setOffers] = useState<Offer[]>([]); // State for offers
  const [loading, setLoading] = useState(true);
  const [editingBanner, setEditingBanner] = useState(false);

  // Form States
  const [newItem, setNewItem] = useState({ name: '', description: '', price: '', category_id: '', image_url: '', is_available: true, is_special: false, prep_time: '' });
  const [newBanner, setNewBanner] = useState({ title: '', subtitle: '', button_text: '', button_link: '', image_url: '' });
  const [newOffer, setNewOffer] = useState(initialNewOfferState);

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [authLoading, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, categoriesRes, bannerRes, ordersRes, offersRes] = await Promise.all([
        supabase.from('menu_items').select('*').order('created_at', { ascending: false }),
        supabase.from('menu_categories').select('*').order('sort_order'),
        supabase.from('banner_settings').select('*').eq('is_active', true).limit(1).maybeSingle(),
        supabase.from('orders').select('*, order_items(quantity, menu_items(name))').order('created_at', { ascending: false }),
        supabase.from('offers').select('*').order('created_at', { ascending: false }) // Fetch offers
      ]);

      if (itemsRes.error) throw itemsRes.error;
      setMenuItems(itemsRes.data || []);

      if (categoriesRes.error) throw categoriesRes.error;
      setCategories(categoriesRes.data || []);
      
      if (bannerRes.data) {
        setBannerSettings(bannerRes.data);
        setNewBanner({
          title: bannerRes.data.title || '', subtitle: bannerRes.data.subtitle || '',
          button_text: bannerRes.data.button_text || '', button_link: bannerRes.data.button_link || '',
          image_url: bannerRes.data.image_url || '',
        });
      }
      
      if (ordersRes.error) throw ordersRes.error;
      setOrders(ordersRes.data as AdminOrder[] || []);

      if (offersRes.error) throw offersRes.error;
      setOffers(offersRes.data || []);

    } catch (error: any) {
      toast({ title: "Error Fetching Data", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  
  // --- HANDLER FUNCTIONS ---
  const handleAddOffer = async () => {
    if (!newOffer.title || !newOffer.code || !newOffer.discount_value) {
      toast({ title: "Validation Error", description: "Title, Code, and Discount Value are required.", variant: "destructive" });
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
      toast({ title: "Success", description: "New offer has been added!" });
      setNewOffer(initialNewOfferState);
      await fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: `Could not add offer: ${error.message}`, variant: "destructive" });
    }
  };

  const handleDeleteOffer = async (id: string) => {
    try {
      const { error } = await supabase.from('offers').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Success", description: "Offer has been deleted." });
      await fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: `Could not delete offer: ${error.message}`, variant: "destructive" });
    }
  };

  // Other handlers (handleAddItem, handleUpdateBanner, etc.) remain the same
  // ... (Assume other handlers from previous versions are here) ...
    const handleAddItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.category_id) {
        toast({ title: "Validation Error", description: "Name, price, and category are required.", variant: "destructive" });
        return;
    }
    try {
      const { error } = await supabase.from('menu_items').insert({
        name: newItem.name, description: newItem.description, price: parseFloat(newItem.price),
        category_id: newItem.category_id, image_url: newItem.image_url || null, is_available: newItem.is_available,
        is_special: newItem.is_special, prep_time: newItem.prep_time ? parseInt(newItem.prep_time) : null,
      }).select();
      if (error) throw error;
      toast({ title: "Success", description: "Menu item added successfully!" });
      setNewItem({ name: '', description: '', price: '', category_id: '', image_url: '', is_available: true, is_special: false, prep_time: '' });
      await fetchData();
    } catch (error: any) {
      toast({ title: "Error: Could not add item", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdateBanner = async () => {
    try {
      if (bannerSettings) {
        const { error } = await supabase.from('banner_settings').update({ ...newBanner }).eq('id', bannerSettings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('banner_settings').insert({ ...newBanner, is_active: true });
        if (error) throw error;
      }
      toast({ title: "Success", description: "Banner updated successfully!" });
      setEditingBanner(false);
      await fetchData();
    } catch (error: any) {
      toast({ title: "Error: Could not update banner", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Success", description: "Menu item deleted." });
      await fetchData();
    } catch (error: any) {
      toast({ title: "Error: Could not delete item", description: error.message, variant: "destructive" });
    }
  };
  
  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
        const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
        if (error) throw error;
        toast({ title: "Status Updated", description: `Order status changed to ${newStatus}.` });
        setOrders(currentOrders => 
          currentOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
        );
    } catch (error: any) {
        toast({ title: "Error: Could not update status", description: error.message, variant: "destructive" });
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading Admin Panel...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>
        
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders">Order Management</TabsTrigger>
            <TabsTrigger value="offers">Offer Management</TabsTrigger> {/* New Tab */}
            <TabsTrigger value="menu">Menu Management</TabsTrigger>
            <TabsTrigger value="banner">Banner Settings</TabsTrigger>
          </TabsList>

          {/* New Offer Management Tab Content */}
          <TabsContent value="offers">
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Add New Offer</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="offer-title">Title</Label><Input id="offer-title" value={newOffer.title} onChange={(e) => setNewOffer({...newOffer, title: e.target.value})} placeholder="e.g. Weekend Special"/></div>
                    <div className="space-y-2"><Label htmlFor="offer-code">Promo Code</Label><Input id="offer-code" value={newOffer.code} onChange={(e) => setNewOffer({...newOffer, code: e.target.value.toUpperCase()})} placeholder="e.g. WEEKEND20"/></div>
                  </div>
                  <div className="space-y-2"><Label htmlFor="offer-desc">Description</Label><Textarea id="offer-desc" value={newOffer.description} onChange={(e) => setNewOffer({...newOffer, description: e.target.value})} placeholder="Describe the offer"/></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Discount Type</Label><Select value={newOffer.discount_type} onValueChange={(v) => setNewOffer({...newOffer, discount_type: v as any})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="percentage">Percentage (%)</SelectItem><SelectItem value="fixed">Fixed ($)</SelectItem></SelectContent></Select></div>
                    <div className="space-y-2"><Label htmlFor="offer-value">Discount Value</Label><Input id="offer-value" type="number" value={newOffer.discount_value} onChange={(e) => setNewOffer({...newOffer, discount_value: e.target.value})} placeholder="e.g. 20 or 5"/></div>
                    <div className="space-y-2"><Label htmlFor="offer-min">Min. Order Amount ($)</Label><Input id="offer-min" type="number" value={newOffer.min_order_amount} onChange={(e) => setNewOffer({...newOffer, min_order_amount: e.target.value})} placeholder="e.g. 50"/></div>
                  </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label htmlFor="offer-from">Valid From</Label><Input id="offer-from" type="date" value={newOffer.valid_from} onChange={(e) => setNewOffer({...newOffer, valid_from: e.target.value})}/></div>
                    <div className="space-y-2"><Label htmlFor="offer-until">Valid Until</Label><Input id="offer-until" type="date" value={newOffer.valid_until} onChange={(e) => setNewOffer({...newOffer, valid_until: e.target.value})}/></div>
                    <div className="space-y-2"><Label htmlFor="offer-limit">Usage Limit</Label><Input id="offer-limit" type="number" value={newOffer.usage_limit} onChange={(e) => setNewOffer({...newOffer, usage_limit: e.target.value})} placeholder="Leave blank for unlimited"/></div>
                  </div>
                  <div className="flex items-center space-x-2 pt-2"><Switch id="offer-active" checked={newOffer.is_active} onCheckedChange={(c) => setNewOffer({...newOffer, is_active: c})}/><Label htmlFor="offer-active">Activate Offer</Label></div>
                  <Button onClick={handleAddOffer}><Plus className="mr-2 h-4 w-4"/>Add Offer</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Existing Offers</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {offers.length > 0 ? offers.map(offer => (
                      <div key={offer.id} className="border p-4 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-bold text-lg flex items-center gap-2">
                            {offer.title} <Badge>{offer.code}</Badge> 
                            {offer.is_active ? <Badge variant="default">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                          </p>
                          <p className="text-sm text-muted-foreground">{offer.description}</p>
                          <p className="text-sm">Discount: <strong>{offer.discount_type === 'percentage' ? `${offer.discount_value}%` : `$${offer.discount_value}`}</strong> on orders over ${offer.min_order_amount}</p>
                          <p className="text-xs text-muted-foreground">Valid: {new Date(offer.valid_from).toLocaleDateString()} to {new Date(offer.valid_until).toLocaleDateString()}</p>
                          <p className="text-xs text-muted-foreground">Usage: {offer.used_count} / {offer.usage_limit || '∞'}</p>
                        </div>
                        <Button variant="destructive" size="icon" onClick={() => handleDeleteOffer(offer.id)}>
                          <Trash2 className="h-4 w-4"/>
                        </Button>
                      </div>
                    )) : <p className="text-muted-foreground text-center">No offers found.</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Other Tabs (Orders, Menu, Banner) */}
          {/* ... The JSX for the other tabs from previous versions goes here ... */}
            <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Manage All Customer Orders</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map(order => (
                      <Card key={order.id} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <div className="space-y-2">
                                <p className="font-semibold">Order #{order.order_number}</p>
                                <p className="text-sm">
                                    <strong>User ID:</strong> 
                                    <span className="font-mono text-xs ml-2 p-1 bg-muted rounded">{order.user_id}</span>
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    <strong>Date:</strong> {new Date(order.created_at).toLocaleString()}
                                </p>
                           </div>
                           <div className="space-y-2">
                                <Label>Summary</Label>
                                <p className="text-lg font-bold">Total: ${order.total_amount.toFixed(2)}</p>
                                <ul className="text-sm text-muted-foreground">
                                    {order.order_items.map((item, index) => (
                                        <li key={index}>{item.quantity}x {item.menu_items?.name || 'Unknown Item'}</li>
                                    ))}
                                </ul>
                           </div>
                           <div className="flex items-center space-x-2 justify-self-start md:justify-self-end">
                               <Label htmlFor={`status-${order.id}`}>Status:</Label>
                               <Select 
                                 value={order.status} 
                                 onValueChange={(newStatus) => handleUpdateOrderStatus(order.id, newStatus as Order['status'])}
                               >
                                  <SelectTrigger id={`status-${order.id}`} className="w-[180px]"><SelectValue placeholder="Update status" /></SelectTrigger>
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
                ) : (<div className="text-center py-8 text-muted-foreground"><Package className="h-12 w-12 mx-auto mb-4" /><p>No orders found.</p></div>)}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="banner" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Landing Page Banner
                  <Button variant="outline" size="sm" onClick={() => setEditingBanner(!editingBanner)}>
                    {editingBanner ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingBanner ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label htmlFor="banner-title">Title</Label><Input id="banner-title" value={newBanner.title} onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })} placeholder="Banner title" /></div>
                      <div className="space-y-2"><Label htmlFor="banner-subtitle">Subtitle</Label><Input id="banner-subtitle" value={newBanner.subtitle} onChange={(e) => setNewBanner({ ...newBanner, subtitle: e.target.value })} placeholder="Banner subtitle" /></div>
                      <div className="space-y-2"><Label htmlFor="banner-button-text">Button Text</Label><Input id="banner-button-text" value={newBanner.button_text} onChange={(e) => setNewBanner({ ...newBanner, button_text: e.target.value })} placeholder="Button text" /></div>
                      <div className="space-y-2"><Label htmlFor="banner-button-link">Button Link</Label><Input id="banner-button-link" value={newBanner.button_link} onChange={(e) => setNewBanner({ ...newBanner, button_link: e.target.value })} placeholder="/menu" /></div>
                    </div>
                    <div className="space-y-2"><Label htmlFor="banner-image-url">Background Image URL</Label><Input id="banner-image-url" value={newBanner.image_url} onChange={(e) => setNewBanner({ ...newBanner, image_url: e.target.value })} placeholder="https://example.com/banner.jpg" /></div>
                    <div className="flex gap-2">
                      <Button onClick={handleUpdateBanner}><Save className="h-4 w-4 mr-2" /> Save Banner</Button>
                      <Button variant="outline" onClick={() => setEditingBanner(false)}>Cancel</Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <p><strong>Title:</strong> {bannerSettings?.title || 'Not set'}</p><p><strong>Subtitle:</strong> {bannerSettings?.subtitle || 'Not set'}</p>
                    <p><strong>Button:</strong> {bannerSettings?.button_text || 'Not set'} → {bannerSettings?.button_link || 'Not set'}</p>
                    <p><strong>Background Image:</strong> {bannerSettings?.image_url ? 'Set' : 'Not set'}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="menu" className="space-y-6">
            <Card>
                <CardHeader><CardTitle>Add New Menu Item</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="item-name">Name</Label><Input id="item-name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="Item name" /></div>
                        <div className="space-y-2"><Label htmlFor="item-price">Price</Label><Input id="item-price" type="number" step="0.01" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} placeholder="0.00" /></div>
                        <div className="space-y-2">
                            <Label htmlFor="item-category">Category</Label>
                            <Select value={newItem.category_id} onValueChange={(value) => setNewItem({ ...newItem, category_id: value })}>
                                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                <SelectContent>{categories.map((category) => (<SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2"><Label htmlFor="item-prep-time">Prep Time (minutes)</Label><Input id="item-prep-time" type="number" value={newItem.prep_time} onChange={(e) => setNewItem({ ...newItem, prep_time: e.target.value })} placeholder="15" /></div>
                    </div>
                    <div className="space-y-2"><Label htmlFor="item-description">Description</Label><Textarea id="item-description" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} placeholder="Item description" /></div>
                    <div className="space-y-2"><Label htmlFor="item-image-url">Image URL</Label><Input id="item-image-url" value={newItem.image_url} onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })} placeholder="https://example.com/image.jpg" /></div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2"><Switch id="item-available" checked={newItem.is_available} onCheckedChange={(checked) => setNewItem({ ...newItem, is_available: checked })} /><Label htmlFor="item-available">Available</Label></div>
                        <div className="flex items-center space-x-2"><Switch id="item-special" checked={newItem.is_special} onCheckedChange={(checked) => setNewItem({ ...newItem, is_special: checked })} /><Label htmlFor="item-special">Special Item</Label></div>
                    </div>
                    <Button onClick={handleAddItem}><Plus className="h-4 w-4 mr-2" /> Add Menu Item</Button>
                </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.map((item) => (
                    <Card key={item.id}>
                        <CardContent className="p-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">{item.name}</h3>
                                    <div className="flex gap-1">
                                        {item.is_special && <Badge variant="secondary">Special</Badge>}
                                        {!item.is_available && <Badge variant="destructive">Unavailable</Badge>}
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                                <p className="font-bold">${item.price}</p>
                                {item.image_url && (<img src={item.image_url} alt={item.name} className="w-full h-32 object-cover rounded" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />)}
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handleDeleteItem(item.id)} className="text-destructive hover:bg-destructive hover:text-destructive-foreground"><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};