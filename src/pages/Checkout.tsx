import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MapPin, Clock, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useCart } from '@/hooks/useCart';
import { Header } from '@/components/layout/Header';

export const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems: cart, clearCart } = useCart();
  const [userId, setUserId] = useState<string | null>(null);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [creditCardDetails, setCreditCardDetails] = useState({ number: '', expiry: '', cvv: '' });
  const [deliveryType, setDeliveryType] = useState('immediate');
  const [scheduledTime, setScheduledTime] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [offerCode, setOfferCode] = useState('');
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [loading, setLoading] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + ((item.menu_item?.price || 0) * item.quantity), 0);
  const taxRate = 0.1;
  const deliveryFee = 3.99;
  const taxAmount = subtotal * taxRate;

  let discountAmount = 0;
  if (appliedOffer) {
    if (appliedOffer.discount_type === 'percentage') {
      discountAmount = Math.min(
        subtotal * (appliedOffer.discount_value / 100),
        appliedOffer.max_discount || Infinity
      );
    } else {
      discountAmount = appliedOffer.discount_value;
    }
  }

  const total = Math.max(0, subtotal + taxAmount + deliveryFee - discountAmount);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate('/auth');
      } else {
        setUserId(user.id);
        fetchAddresses(user.id);
      }
    });
  }, [navigate]);

  const fetchAddresses = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });

      if (data) {
        setAddresses(data);
        const defaultAddress = data.find(addr => addr.is_default);
        if (defaultAddress) setSelectedAddress(defaultAddress.id);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const handleApplyOffer = async () => {
    if (!offerCode.trim()) return;

    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('code', offerCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        toast({
          title: "Invalid Code",
          description: "Offer code not found or expired",
          variant: "destructive"
        });
        return;
      }

      if (subtotal < data.min_order_amount) {
        toast({
          title: "Minimum Order Not Met",
          description: `This offer requires a minimum order of $${data.min_order_amount}`,
          variant: "destructive"
        });
        return;
      }

      setAppliedOffer(data as Offer);
      toast({
        title: "Offer Applied!",
        description: `${data.discount_type === 'percentage' ? `${data.discount_value}% off` : `$${data.discount_value} off`} your order`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply offer code",
        variant: "destructive"
      });
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast({
        title: "Address Required",
        description: "Please select a delivery address",
        variant: "destructive"
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const selectedAddr = addresses.find(addr => addr.id === selectedAddress);
      if (!selectedAddr) throw new Error('Selected address not found');

      // Generate order number
      const { data: orderNumber } = await supabase.rpc('generate_order_number');

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          order_number: orderNumber,
          user_id: userId,
          payment_method: paymentMethod,
          delivery_type: deliveryType,
          scheduled_for: deliveryType === 'scheduled' ? scheduledTime : null,
          delivery_address: {
            street_address: selectedAddr.street_address,
            city: selectedAddr.city,
            state: selectedAddr.state,
            zip_code: selectedAddr.zip_code,
            label: selectedAddr.label
          },
          subtotal: subtotal,
          tax_amount: taxAmount,
          delivery_fee: deliveryFee,
          discount_amount: discountAmount,
          total_amount: total,
          offer_id: appliedOffer?.id || null,
          special_instructions: specialInstructions,
          item_name: cart.map(item => item.menu_item?.name).join(', ')
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: item.menu_item?.price || 0,
        total_price: (item.menu_item?.price || 0) * item.quantity,
        special_requests: item.special_requests
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update offer usage count
      if (appliedOffer) {
        await supabase
          .from('offers')
          .update({ used_count: (appliedOffer as any).used_count + 1 })
          .eq('id', appliedOffer.id);
      }

      // Clear cart
      clearCart();

      toast({
        title: "Order Placed!",
        description: `Your order #${orderNumber} has been placed successfully`,
      });

      navigate('/profile?tab=orders');

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to place order",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Forms */}
            <div className="space-y-6">
              {/* Delivery Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
                    {addresses.map((address) => (
                      <div key={address.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value={address.id} id={address.id} />
                        <div className="flex-1">
                          <label htmlFor={address.id} className="cursor-pointer">
                            <div className="flex items-center gap-2 mb-1">
                              {address.label && <Badge variant="outline">{address.label}</Badge>}
                              {address.is_default && <Badge>Default</Badge>}
                            </div>
                            <p className="font-medium">{address.street_address}</p>
                            <p className="text-sm text-muted-foreground">
                              {address.city}, {address.state} {address.zip_code}
                            </p>
                          </label>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                  {addresses.length === 0 && (
                    <p className="text-muted-foreground">
                      No addresses found. Please add an address in your profile.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Delivery Time */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Delivery Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={deliveryType} onValueChange={(value: 'immediate' | 'scheduled') => setDeliveryType(value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="immediate" id="immediate" />
                      <Label htmlFor="immediate">ASAP (30-45 minutes)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="scheduled" id="scheduled" />
                      <Label htmlFor="scheduled">Schedule for later</Label>
                    </div>
                  </RadioGroup>
                  
                  {deliveryType === 'scheduled' && (
                    <div className="mt-4">
                      <Label htmlFor="scheduled-time">Select Time</Label>
                      <Input
                        id="scheduled-time"
                        type="datetime-local"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={(value: 'card' | 'cod') => setPaymentMethod(value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card">Credit/Debit Card</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod">Cash on Delivery</Label>
                    </div>
                  </RadioGroup>

                  {paymentMethod === 'card' && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <Label htmlFor="card-number">Card Number</Label>
                        <Input
                          id="card-number"
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          value={creditCardDetails.number}
                          onChange={(e) => setCreditCardDetails({ ...creditCardDetails, number: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="card-expiry">Expiry Date</Label>
                        <Input
                          id="card-expiry"
                          type="text"
                          placeholder="MM/YY"
                          value={creditCardDetails.expiry}
                          onChange={(e) => setCreditCardDetails({ ...creditCardDetails, expiry: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="card-cvv">CVV</Label>
                        <Input
                          id="card-cvv"
                          type="text"
                          placeholder="123"
                          value={creditCardDetails.cvv}
                          onChange={(e) => setCreditCardDetails({ ...creditCardDetails, cvv: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Special Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>Special Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Any special instructions for your order..."
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Order Summary */}
            <div className="space-y-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.menu_item?.name || 'Unknown Item'}</p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                          {item.special_requests && (
                            <p className="text-xs text-muted-foreground">Note: {item.special_requests}</p>
                          )}
                        </div>
                        <p className="font-medium">${((item.menu_item?.price || 0) * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Offer Code */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Offer Code
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter offer code"
                      value={offerCode}
                      onChange={(e) => setOfferCode(e.target.value)}
                      disabled={!!appliedOffer}
                    />
                    <Button 
                      onClick={handleApplyOffer}
                      disabled={!!appliedOffer || !offerCode.trim()}
                    >
                      Apply
                    </Button>
                  </div>
                  {appliedOffer && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm text-green-800">
                        Offer "{appliedOffer.code}" applied! 
                        {appliedOffer.discount_type === 'percentage' 
                          ? ` ${appliedOffer.discount_value}% off` 
                          : ` $${appliedOffer.discount_value} off`
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Price Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Price Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>${taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span>${deliveryFee.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <hr />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <Button
                    className="btn-food w-full mt-6"
                    onClick={handlePlaceOrder}
                    disabled={loading || cart.length === 0 || !selectedAddress}
                  >
                    {loading ? 'Placing Order...' : `Place Order - $${total.toFixed(2)}`}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
