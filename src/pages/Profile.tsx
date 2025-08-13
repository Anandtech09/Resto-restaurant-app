import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
        className: 'bg-coffee-light text-coffee-dark'
      });

      setIsProfileDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
        className: 'bg-destructive text-destructive-foreground'
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
        className: 'bg-coffee-light text-coffee-dark'
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
        variant: "destructive",
        className: 'bg-destructive text-destructive-foreground'
      });
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user?.id);

      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Default address updated",
        className: 'bg-coffee-light text-coffee-dark'
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
        className: 'bg-destructive text-destructive-foreground'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-coffee-light text-white';
      case 'out_for_delivery': return 'bg-accent text-accent-foreground';
      case 'preparing': return 'bg-gold-light text-gold';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center animate-fade-up">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coffee mx-auto mb-4"></div>
            <p className="text-muted-foreground font-inter">Brewing your profile...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 animate-fade-up">
            <div className="flex items-center gap-3 mb-4">
              <User className="h-10 w-10 text-coffee" />
            <h1 className="text-5xl font-display text-coffee-dark mb-1">My Profile</h1>
            </div>
            <p className="text-muted-foreground font-inter text-lg">Manage your profile, addresses, and orders with ease</p>
          </div>
      

          <Tabs defaultValue="profile" className="space-y-8">
            <TabsList className="grid w-full grid-cols-3 bg-coffee-light/20 rounded-lg p-1">
              <TabsTrigger value="profile" className="font-inter text-coffee-dark data-[state=active]:bg-gold data-[state=active]:text-coffee-dark">
                Profile
              </TabsTrigger>
              <TabsTrigger value="addresses" className="font-inter text-coffee-dark data-[state=active]:bg-gold data-[state=active]:text-coffee-dark">
                Addresses
              </TabsTrigger>
              <TabsTrigger value="orders" className="font-inter text-coffee-dark data-[state=active]:bg-gold data-[state=active]:text-coffee-dark">
                Order History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="animate-scale-in">
              <Card className="bg-card shadow-coffee border-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl font-display text-coffee-dark">
                    <User className="h-6 w-6 text-coffee" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-muted-foreground font-inter">Full Name</Label>
                    <p className="text-lg font-inter text-foreground">{profile?.full_name || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground font-inter">Phone Number</Label>
                    <p className="text-lg font-inter text-foreground">{profile?.phone || user?.user_metadata?.phone || 'Not set'}</p>
                  </div>
                  <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gold hover:bg-coffee hover:text-white text-coffee-foreground transition-all duration-300 shadow-glow">
                        Edit Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-none shadow-coffee">
                      <DialogHeader>
                        <DialogTitle className="font-display text-coffee-dark">Edit Profile</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleUpdateProfile} className="space-y-6">
                        <div>
                          <Label htmlFor="full_name" className="font-inter text-muted-foreground">Full Name</Label>
                          <Input
                            id="full_name"
                            value={profileForm.full_name}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                            required
                            className="border-coffee/20 focus:ring-coffee focus:border-coffee"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone" className="font-inter text-muted-foreground">Phone Number</Label>
                          <Input
                            id="phone"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                            required
                            className="border-coffee/20 focus:ring-coffee focus:border-coffee"
                          />
                        </div>
                        <DialogFooter>
                          <Button type="submit" className="bg-coffee hover:bg-coffee-dark text-coffee-foreground transition-all duration-300">
                            Save Changes
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="addresses" className="animate-scale-in">
              <Card className="bg-card shadow-coffee border-none">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-3 text-2xl font-display text-coffee-dark">
                      <MapPin className="h-6 w-6 text-coffee" />
                      Saved Addresses
                    </CardTitle>
                    <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-gold hover:bg-coffee hover:text-white text-coffee-foreground transition-all duration-300 shadow-glow">
                          Add Address
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-none shadow-coffee">
                        <DialogHeader>
                          <DialogTitle className="font-display text-coffee">Add New Address</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddAddress} className="space-y-6">
                          <div>
                            <Label htmlFor="label" className="font-inter text-muted-foreground">Email</Label>
                            <Input
                              id="label"
                              value={addressForm.label}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, label: e.target.value }))}
                              className="border-coffee/20 focus:ring-coffee focus:border-coffee"
                            />
                          </div>
                          <div>
                            <Label htmlFor="street_address" className="font-inter text-muted-foreground">Street Address</Label>
                            <Input
                              id="street_address"
                              value={addressForm.street_address}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, street_address: e.target.value }))}
                              required
                              className="border-coffee/20 focus:ring-coffee focus:border-coffee"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="city" className="font-inter text-muted-foreground">City</Label>
                              <Input
                                id="city"
                                value={addressForm.city}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                                required
                                className="border-coffee/20 focus:ring-coffee focus:border-coffee"
                              />
                            </div>
                            <div>
                              <Label htmlFor="state" className="font-inter text-muted-foreground">State</Label>
                              <Input
                                id="state"
                                value={addressForm.state}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                                required
                                className="border-coffee/20 focus:ring-coffee focus:border-coffee"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="zip_code" className="font-inter text-muted-foreground">ZIP Code</Label>
                            <Input
                              id="zip_code"
                              value={addressForm.zip_code}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, zip_code: e.target.value }))}
                              required
                              className="border-coffee/20 focus:ring-coffee focus:border-coffee"
                            />
                          </div>
                          <DialogFooter>
                            <Button type="submit" className="bg-gold hover:bg-coffee hover:text-white text-coffee-foreground transition-all duration-300">
                              Add Address
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className="border border-coffee/20 rounded-md p-4 hover:bg-coffee-light/10 transition-all duration-300 animate-fade-up"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            {address.label && (
                              <p>
                                {address.label}
                              </p>
                            )}
                            {address.is_default && (
                              <Badge className="bg-gold-light text-coffee font-inter">Default</Badge>
                            )}
                          </div>
                          <p className="font-medium font-inter text-foreground">{address.street_address}</p>
                          <p className="text-muted-foreground font-inter">
                            {address.city}, {address.state} {address.zip_code}
                          </p>
                        </div>
                        {!address.is_default && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSetDefaultAddress(address.id)}
                            className="border-coffee text-coffee hover:bg-coffee hover:text-coffee-foreground transition-all duration-300"
                          >
                            Set Default
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {addresses.length === 0 && (
                    <p className="text-muted-foreground text-center py-8 font-inter">
                      No addresses saved yet. Add your first address above.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="animate-scale-in">
              <Card className="bg-card shadow-coffee border-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl font-display text-coffee-dark">
                    <Clock className="h-6 w-6 text-coffee" />
                    Order History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-coffee/20 rounded-md p-4 hover:bg-coffee-light/10 transition-all duration-300 animate-fade-up"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold font-inter text-coffee-dark">Order #{order.order_number}</h3>
                          <p className="text-sm text-muted-foreground font-inter">
                            {new Date(order.created_at).toLocaleDateString()} at{' '}
                            {new Date(order.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={`${getStatusColor(order.status)} font-inter`}>
                            {order.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <p className="font-semibold font-inter text-coffee-dark mt-1">${order.total_amount.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {order.order_items.map((item, index) => (
                          <p key={index} className="text-sm text-muted-foreground font-inter">
                            {item.quantity}x {item.menu_items.name}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <p className="text-muted-foreground text-center py-8 font-inter">
                      No orders yet. Start by placing your first order!
                    </p>
                  )}
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