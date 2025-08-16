import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MapPin, Clock, Gift, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useCart } from '@/hooks/useCart';
import { Header } from '@/components/layout/Header';
import { Offer } from '@/types';

interface OrderSuccessData {
  orderNumber: string;
  total: number;
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  discountAmount: number;
  appliedOfferCode?: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    totalPrice: number;
  }>;
}

export const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems: cart, clearCart } = useCart();
  const [userId, setUserId] = useState<string | null>(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [creditCardDetails, setCreditCardDetails] = useState({ number: '', expiry: '', cvv: '' });
  const [paypalEmail, setPaypalEmail] = useState('');
  const [deliveryType, setDeliveryType] = useState('immediate');
  const [scheduledTime, setScheduledTime] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [offerCode, setOfferCode] = useState('');
  const [appliedOffer, setAppliedOffer] = useState<Offer | null>(null);
  const [applyingOffer, setApplyingOffer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<OrderSuccessData | null>(null);

  const subtotal = cart.reduce((sum, item) => sum + ((item.menu_item?.price || 0) * item.quantity), 0);
  const taxRate = 0.08;
  const deliveryFee = subtotal > 25 ? 0 : 2.99;
  const discountAmount = appliedOffer
    ? appliedOffer.discount_type === 'percentage'
      ? Math.min(subtotal * (appliedOffer.discount_value / 100), appliedOffer.max_discount || Infinity)
      : appliedOffer.discount_value
    : 0;
  const taxAmount = (subtotal - discountAmount) * taxRate;
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

      if (data && data.length > 0) {
        setAddresses(data);
        const defaultAddress = data.find(addr => addr.is_default);
        if (defaultAddress) setSelectedAddress(defaultAddress.id);
      } else {
        toast({
          title: 'No Addresses Found',
          description: 'Please add a delivery address in your profile.',
          variant: 'destructive',
        });
        navigate('/profile');
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      navigate('/profile');
    }
  };

  const handleApplyOffer = async () => {
    if (!offerCode.trim()) return;
    setApplyingOffer(true);
    try {
      const { data: offer } = await supabase
        .from('offers')
        .select('*')
        .eq('code', offerCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (!offer) {
        toast({
          title: 'Invalid code',
          description: 'Offer is invalid or expired.',
          variant: 'destructive',
        });
        return;
      }
      if (subtotal < offer.min_order_amount) {
        toast({
          title: 'Minimum order not met',
          description: `Minimum $${offer.min_order_amount}`,
          variant: 'destructive',
        });
        return;
      }
      setAppliedOffer(offer as Offer);
      toast({
        title: 'Offer applied!',
        description: `You saved ${offer.discount_type === 'percentage' ? `${offer.discount_value}%` : `$${offer.discount_value}`}!`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to apply offer.',
        variant: 'destructive',
      });
    } finally {
      setApplyingOffer(false);
    }
  };

  const validatePaymentDetails = () => {
    if (paymentMethod === 'card') {
      if (!creditCardDetails.number.trim() || !creditCardDetails.expiry.trim() || !creditCardDetails.cvv.trim()) {
        toast({
          title: 'Incomplete Card Details',
          description: 'Please enter card number, expiry date, and CVV.',
          variant: 'destructive',
        });
        return false;
      }
      if (creditCardDetails.number.length < 12 || creditCardDetails.cvv.length < 3) {
        toast({
          title: 'Invalid Card Details',
          description: 'Please check your card number and CVV.',
          variant: 'destructive',
        });
        return false;
      }
    } else if (paymentMethod === 'paypal') {
      if (!paypalEmail.trim() || !paypalEmail.includes('@')) {
        toast({
          title: 'Invalid PayPal Email',
          description: 'Please enter a valid email address for PayPal.',
          variant: 'destructive',
        });
        return false;
      }
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast({
        title: 'Address Required',
        description: 'Please select a delivery address',
        variant: 'destructive',
      });
      return;
    }
    if (cart.length === 0) {
      toast({
        title: 'Empty Cart',
        description: 'Your cart is empty',
        variant: 'destructive',
      });
      return;
    }
    if (!validatePaymentDetails()) {
      return;
    }
    
    setLoading(true);
    try {
      const selectedAddr = addresses.find(addr => addr.id === selectedAddress);
      if (!selectedAddr) throw new Error('Selected address not found');

      const { data: orderNumber } = await supabase.rpc('generate_order_number');
      
      // Store order success data BEFORE clearing cart and resetting state
      const orderSuccessData: OrderSuccessData = {
        orderNumber,
        total,
        subtotal,
        taxAmount,
        deliveryFee,
        discountAmount,
        appliedOfferCode: appliedOffer?.code,
        items: cart.map(item => ({
          id: item.id,
          name: item.menu_item?.name || 'Unknown Item',
          quantity: item.quantity,
          price: item.menu_item?.price || 0,
          totalPrice: (item.menu_item?.price || 0) * item.quantity,
        })),
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
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
              label: selectedAddr.label,
            },
            subtotal: subtotal,
            tax_amount: taxAmount,
            delivery_fee: deliveryFee,
            discount_amount: discountAmount,
            total_amount: total,
            offer_id: appliedOffer?.id || null,
            special_instructions: specialInstructions,
            item_name: cart.map(item => item.menu_item?.name).join(', '),
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map(item => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: item.menu_item?.price || 0,
        total_price: (item.menu_item?.price || 0) * item.quantity,
        special_requests: item.special_requests,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      if (appliedOffer) {
        await supabase
          .from('offers')
          .update({ used_count: appliedOffer.used_count + 1 })
          .eq('id', appliedOffer.id);
      }

      // Clear cart and set success data
      clearCart();
      setOrderSuccess(orderSuccessData);
      
      toast({
        title: 'Order Placed!',
        description: `Your order #${orderNumber} has been placed successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to place order',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return null;
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-background pt-6 pb-12">
        <Header />
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center py-16">
            <Card className="coffee-card shadow-coffee">
              <CardContent className="p-6 space-y-4">
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
                <h1 className="font-display text-3xl font-bold text-coffee">Order Placed Successfully!</h1>
                <p className="text-muted-foreground">
                  Your order #{orderSuccess.orderNumber} for ${orderSuccess.total.toFixed(2)} has been placed.
                </p>
                <div className="space-y-2 text-left">
                  <p className="text-sm font-medium">Order Details:</p>
                  {orderSuccess.items.map(item => (
                    <div key={item.id} className="text-sm text-muted-foreground">
                      <span>{item.name} × {item.quantity}</span>
                      <span className="float-right">${item.totalPrice.toFixed(2)}</span>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="text-sm">
                    <span>Subtotal</span>
                    <span className="float-right">${orderSuccess.subtotal.toFixed(2)}</span>
                  </div>
                  {orderSuccess.discountAmount > 0 && (
                    <div className="text-sm text-green-600">
                      <span>Discount ({orderSuccess.appliedOfferCode})</span>
                      <span className="float-right">-${orderSuccess.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="text-sm">
                    <span>Tax (8%)</span>
                    <span className="float-right">${orderSuccess.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="text-sm">
                    <span>Delivery Fee</span>
                    <span className="float-right">{orderSuccess.deliveryFee === 0 ? 'FREE' : `$${orderSuccess.deliveryFee.toFixed(2)}`}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="text-sm font-bold text-coffee">
                    <span>Total</span>
                    <span className="float-right">${orderSuccess.total.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Order details have been sent to your phone number.
                </p>
                <Button
                  className="btn-coffee w-full animate-gold-shimmer"
                  onClick={() => navigate('/orders')}
                >
                  Continue
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-6 pb-12">
      <Header />
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="font-display text-4xl font-bold text-coffee animate-fade-up">Checkout</h1>
            <p className="text-muted-foreground mt-2">Complete your order</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Address */}
              <Card className="coffee-card shadow-coffee">
                <CardHeader>
                  <CardTitle className="font-display text-xl text-coffee flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {addresses.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">No addresses found. Please add one in your profile.</p>
                      <Button
                        variant="outline"
                        className="mt-2"
                        onClick={() => navigate('/profile')}
                      >
                        Add Address
                      </Button>
                    </div>
                  ) : (
                    <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
                      {addresses.map(address => (
                        <div
                          key={address.id}
                          className="flex items-start space-x-3 p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors mb-2"
                        >
                          <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                          <div className="flex-1">
                            <label htmlFor={address.id} className="cursor-pointer">
                              <div className="flex items-center gap-2 mb-1">
                                {address.label && <p className="font-medium">{address.label}</p>}
                                {address.is_default && <Badge className="bg-gold text-coffee">Default</Badge>}
                              </div>
                              <p className="text-sm font-medium">{address.street_address}</p>
                              <p className="text-sm text-muted-foreground">
                                {address.city}, {address.state} {address.zip_code}
                              </p>
                            </label>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                </CardContent>
              </Card>

              {/* Delivery Time */}
              <Card className="coffee-card shadow-coffee">
                <CardHeader>
                  <CardTitle className="font-display text-xl text-coffee flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Delivery Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={deliveryType}
                    onValueChange={(value: 'immediate' | 'scheduled') => setDeliveryType(value)}
                  >
                    <div className="flex items-center space-x-2 p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors">
                      <RadioGroupItem value="immediate" id="immediate" />
                      <Label htmlFor="immediate" className="flex-1 cursor-pointer">
                        <div className="font-medium">ASAP (30-45 minutes)</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors">
                      <RadioGroupItem value="scheduled" id="scheduled" />
                      <Label htmlFor="scheduled" className="flex-1 cursor-pointer">
                        <div className="font-medium">Schedule for later</div>
                      </Label>
                    </div>
                  </RadioGroup>
                  {deliveryType === 'scheduled' && (
                    <div className="mt-4">
                      <Label htmlFor="scheduled-time">Select Time</Label>
                      <Input
                        id="scheduled-time"
                        type="datetime-local"
                        value={scheduledTime}
                        onChange={e => setScheduledTime(e.target.value)}
                        min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)}
                        className="mt-1"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card className="coffee-card shadow-coffee">
                <CardHeader>
                  <CardTitle className="font-display text-xl text-coffee flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value: 'card' | 'cod' | 'paypal') => setPaymentMethod(value)}
                  >
                    <div className="flex items-center space-x-2 p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex-1 cursor-pointer">
                        <div className="font-medium">Credit/Debit Card</div>
                        <div className="text-sm text-muted-foreground">Visa, Mastercard, American Express</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex-1 cursor-pointer">
                        <div className="font-medium">Cash on Delivery</div>
                        <div className="text-sm text-muted-foreground">Pay when you receive your order</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors">
                      <RadioGroupItem value="paypal" id="paypal" />
                      <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                        <div className="font-medium">Paypal</div>
                      </Label>
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
                          onChange={e =>
                            setCreditCardDetails({ ...creditCardDetails, number: e.target.value })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="card-expiry">Expiry Date</Label>
                          <Input
                            id="card-expiry"
                            type="text"
                            placeholder="MM/YY"
                            value={creditCardDetails.expiry}
                            onChange={e =>
                              setCreditCardDetails({ ...creditCardDetails, expiry: e.target.value })
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="card-cvv">CVV</Label>
                          <Input
                            id="card-cvv"
                            type="text"
                            placeholder="123"
                            value={creditCardDetails.cvv}
                            onChange={e =>
                              setCreditCardDetails({ ...creditCardDetails, cvv: e.target.value })
                            }
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {paymentMethod === 'paypal' && (
                    <div className="mt-4">
                      <Label htmlFor="paypal-email">PayPal Email</Label>
                      <Input
                        id="paypal-email"
                        type="email"
                        placeholder="email@example.com"
                        value={paypalEmail}
                        onChange={e => setPaypalEmail(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Special Instructions */}
              <Card className="coffee-card shadow-coffee">
                <CardHeader>
                  <CardTitle className="font-display text-xl text-coffee">Special Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Any special instructions for your order..."
                    value={specialInstructions}
                    onChange={e => setSpecialInstructions(e.target.value)}
                    className="mt-1"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="coffee-card shadow-coffee">
                <CardHeader>
                  <CardTitle className="font-display text-xl text-coffee">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-card rounded-lg flex items-center justify-center">
                          {item.menu_item?.image_url ? (
                            <img
                              src={item.menu_item.image_url}
                              alt={item.menu_item.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <span className="text-xl opacity-50">🍽️</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-coffee truncate">{item.menu_item?.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          {item.special_requests && (
                            <p className="text-xs text-muted-foreground">Note: {item.special_requests}</p>
                          )}
                        </div>
                        <p className="font-medium text-sm">${((item.menu_item?.price || 0) * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (8%)</span>
                      <span className="font-medium">${taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery Fee</span>
                      <span className="font-medium">{deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount ({appliedOffer?.code})</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold text-coffee">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                  {subtotal < 25 && (
                    <p className="text-sm text-muted-foreground mt-4">
                      Add ${(25 - subtotal).toFixed(2)} more for free delivery!
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Offer Code */}
              <Card className="coffee-card shadow-coffee">
                <CardHeader>
                  <CardTitle className="font-display text-xl text-coffee flex items-center">
                    <Gift className="h-5 w-5 mr-2" />
                    Offer Code
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter offer code"
                      value={offerCode}
                      onChange={e => setOfferCode(e.target.value.toUpperCase())}
                      disabled={!!appliedOffer || applyingOffer}
                      className="mt-1"
                    />
                    {appliedOffer ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setAppliedOffer(null);
                          setOfferCode('');
                        }}
                        className="mt-1 animate-scale-in"
                      >
                        Remove
                      </Button>
                    ) : (
                      <Button
                        onClick={handleApplyOffer}
                        disabled={applyingOffer || !offerCode.trim()}
                        className="btn-coffee mt-1 animate-gold-shimmer"
                      >
                        Apply
                      </Button>
                    )}
                  </div>
                  {appliedOffer && (
                    <div className="mt-2 p-2 bg-accent/10 rounded-lg">
                      <p className="text-sm text-green-600">
                        ✓ Offer "{appliedOffer.code}" applied!{' '}
                        {appliedOffer.discount_type === 'percentage'
                          ? `${appliedOffer.discount_value}% off`
                          : `$${appliedOffer.discount_value} off`}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Place Order Button */}
              <Card className="coffee-card shadow-coffee">
                <CardContent className="p-6">
                  <Button
                    className="btn-coffee w-full animate-gold-shimmer"
                    onClick={handlePlaceOrder}
                    disabled={loading || cart.length === 0 || !selectedAddress}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Placing Order...
                      </>
                    ) : (
                      `Place Order • $${total.toFixed(2)}`
                    )}
                  </Button>
                  <div className="bg-accent/10 p-3 rounded-lg mt-4">
                    <p className="text-xs text-muted-foreground text-center">
                      🔒 Your payment information is secure and encrypted
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};