import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/layout/Header';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Offer } from '@/types';

export const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, loading: cartLoading } = useCart();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [offerCode, setOfferCode] = useState('');
  const [appliedOffer, setAppliedOffer] = useState<Offer | null>(null);
  const [applyingOffer, setApplyingOffer] = useState(false);

  if (cartLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const subtotal = getCartTotal();
  const taxRate = 0.08;
  const deliveryFee = subtotal > 25 ? 0 : 2.99;

  const discountAmount = appliedOffer
    ? appliedOffer.discount_type === 'percentage'
      ? Math.min(subtotal * (appliedOffer.discount_value / 100), appliedOffer.max_discount || Infinity)
      : appliedOffer.discount_value
    : 0;

  const taxAmount = (subtotal - discountAmount) * taxRate;
  const total = subtotal + taxAmount + deliveryFee - discountAmount;

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
        toast({ title: 'Invalid code', description: 'Offer is invalid or expired.', variant: 'destructive' });
      } else if (subtotal < offer.min_order_amount) {
        toast({ title: 'Minimum order not met', description: `Minimum $${offer.min_order_amount}`, variant: 'destructive' });
      } else {
        setAppliedOffer(offer as Offer);
        toast({ title: 'Offer applied!', description: `You saved ${offer.discount_type === 'percentage' ? `${offer.discount_value}%` : `$${offer.discount_value}`}!` });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to apply offer.', variant: 'destructive' });
    } finally {
      setApplyingOffer(false);
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      sessionStorage.setItem('redirectAfterLogin', '/checkout');
      navigate('/auth');
      return;
    }
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">Add items to your cart to get started!</p>
          <Link to="/menu"><Button size="lg" className="btn-food">Browse Menu</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map(item => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    {/* Image */}
                    <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center">
                      {item.menu_item?.image_url
                        ? <img src={item.menu_item.image_url} alt={item.menu_item.name} className="w-full h-full object-cover rounded-lg" />
                        : <span className="text-2xl opacity-50">🍽️</span>}
                    </div>
                    {/* Details */}
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.menu_item?.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.menu_item?.description}</p>
                      <p className="price-tag">${item.menu_item?.price.toFixed(2)}</p>
                      {item.special_requests && <p className="text-sm text-muted-foreground mt-1">Special: {item.special_requests}</p>}
                    </div>
                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="icon" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}><Minus className="h-4 w-4" /></Button>
                      <span className="w-12 text-center font-semibold">{item.quantity}</span>
                      <Button variant="outline" size="icon" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" onClick={() => removeFromCart(item.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                {/* Offer Code */}
                <div className="space-y-2 mb-6">
                  <Label htmlFor="offerCode">Offer Code</Label>
                  <div className="flex space-x-2">
                    <Input id="offerCode" value={offerCode} onChange={e => setOfferCode(e.target.value.toUpperCase())} placeholder="Enter code" disabled={!!appliedOffer} />
                    {appliedOffer
                      ? <Button variant="outline" onClick={() => { setAppliedOffer(null); setOfferCode(''); }}>Remove</Button>
                      : <Button variant="outline" onClick={handleApplyOffer} disabled={applyingOffer || !offerCode.trim()}>Apply</Button>}
                  </div>
                  {appliedOffer && <p className="text-sm text-green-600">✓ {appliedOffer.title} applied!</p>}
                </div>
                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                  {appliedOffer && <div className="flex justify-between text-green-600"><span>Discount ({appliedOffer.code})</span><span>-${discountAmount.toFixed(2)}</span></div>}
                  <div className="flex justify-between"><span>Tax</span><span>${taxAmount.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Delivery Fee</span><span>{deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}</span></div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold"><span>Total</span><span>${total.toFixed(2)}</span></div>
                </div>
                {subtotal < 25 && <p className="text-sm text-muted-foreground mt-4">Add ${(25 - subtotal).toFixed(2)} more for free delivery!</p>}
                <Button className="btn-food w-full mt-6" onClick={handleCheckout}>Proceed to Checkout</Button>
                <Link to="/menu"><Button variant="outline" className="w-full mt-2">Continue Shopping</Button></Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
