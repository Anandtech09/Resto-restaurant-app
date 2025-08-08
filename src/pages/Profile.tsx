import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Clock, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface Address {
  id: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  label?: string;
  is_default: boolean;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  order_items: Array<{
    quantity: number;
    menu_items: {
      name: string;
      price: number;
    };
  }>;
}

export const Profile = () => {
  const { user, profile, signOut } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: ''
  });
  const [addressForm, setAddressForm] = useState({
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    label: ''
  });
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchData();
      setProfileForm({
        full_name: profile?.full_name || '',
        phone: profile?.phone || ''
      });
    }
  }, [user, profile]);

  const fetchData = async () => {
    try {
      const [addressesRes, ordersRes] = await Promise.all([
        supabase.from('addresses').select('*').eq('user_id', user?.id).order('is_default', { ascending: false }),
        supabase.from('orders').select(`
          *,
          order_items (
            quantity,
            menu_items (name, price)
          )
        `).eq('user_id', user?.id).order('created_at', { ascending: false })
      ]);

      if (addressesRes.data) setAddresses(addressesRes.data);
      if (ordersRes.data) setOrders(ordersRes.data as any);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileForm)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      setIsProfileDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('addresses')
        .insert([{
          ...addressForm,
          user_id: user?.id,
          is_default: addresses.length === 0
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Address added successfully",
      });

      setIsAddressDialogOpen(false);
      setAddressForm({
        street_address: '',
        city: '',
        state: '',
        zip_code: '',
        label: ''
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      // Remove default from all addresses
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user?.id);

      // Set new default
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Default address updated",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-500';
      case 'out_for_delivery': return 'bg-blue-500';
      case 'preparing': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">My Profile</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-8">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
              <TabsTrigger value="orders">Order History</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your profile information and contact details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Full Name</Label>
                      <p className="text-lg">{profile?.full_name || 'Not set'}</p>
                    </div>
                    <div >
                    <Label>Phone Number</Label>
                    <p className="text-lg">{profile?.phone || user?.user_metadata?.phone || 'Not set'}</p>
                  </div>
                    <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>Edit Profile</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Profile</DialogTitle>
                          <DialogDescription>
                            Update your profile information
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdateProfile}>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="full_name">Full Name</Label>
                              <Input
                                id="full_name"
                                value={profileForm.full_name}
                                onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="phone">Phone Number</Label>
                              <Input
                                id="phone"
                                value={profileForm.phone}
                                onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                                required
                              />
                            </div>
                          </div>
                          <DialogFooter className="mt-6">
                            <Button type="submit">Save Changes</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="addresses">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Saved Addresses
                      </CardTitle>
                      <CardDescription>
                        Manage your delivery addresses
                      </CardDescription>
                    </div>
                    <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>Add Address</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Address</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddAddress}>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="label">Email</Label>
                              <Input
                                id="label"
                                value={addressForm.label}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, label: e.target.value }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="street_address">Street Address</Label>
                              <Input
                                id="street_address"
                                value={addressForm.street_address}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, street_address: e.target.value }))}
                                required
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label htmlFor="city">City</Label>
                                <Input
                                  id="city"
                                  value={addressForm.city}
                                  onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="state">State</Label>
                                <Input
                                  id="state"
                                  value={addressForm.state}
                                  onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                                  required
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="zip_code">ZIP Code</Label>
                              <Input
                                id="zip_code"
                                value={addressForm.zip_code}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, zip_code: e.target.value }))}
                                required
                              />
                            </div>
                          </div>
                          <DialogFooter className="mt-6">
                            <Button type="submit">Add Address</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <div key={address.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              {address.label && <Badge variant="outline">{address.label}</Badge>}
                              {address.is_default && <Badge>Default</Badge>}
                            </div>
                            <p className="font-medium">{address.street_address}</p>
                            <p className="text-muted-foreground">
                              {address.city}, {address.state} {address.zip_code}
                            </p>
                          </div>
                          {!address.is_default && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetDefaultAddress(address.id)}
                            >
                              Set Default
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {addresses.length === 0 && (
                      <p className="text-muted-foreground text-center py-8">
                        No addresses saved yet. Add your first address above.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Order History
                  </CardTitle>
                  <CardDescription>
                    View your past orders and their status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold">Order #{order.order_number}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()} at{' '}
                              {new Date(order.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <p className="font-semibold mt-1">${order.total_amount}</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {order.order_items.map((item, index) => (
                            <p key={index} className="text-sm text-muted-foreground">
                              {item.quantity}x {item.menu_items.name}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                    {orders.length === 0 && (
                      <p className="text-muted-foreground text-center py-8">
                        No orders yet. Start by placing your first order!
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Settings
                  </CardTitle>
                  <CardDescription>
                    Manage your account settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        navigate('/');
                        await signOut();
                      }}
                    >
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
};