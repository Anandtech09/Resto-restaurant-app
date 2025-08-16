import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/layout/Header';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';

export const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart, loading: cartLoading } = useCart();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isClearing, setIsClearing] = useState(false);

  // Recalculate order summary
  const subtotal = getCartTotal();
  const taxRate = 0.08;
  const deliveryFee = subtotal > 25 ? 0 : 2.99;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount + deliveryFee;

  const handleClearCart = async () => {
    setIsClearing(true);
    try {
      await clearCart();
    } finally {
      setIsClearing(false);
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

  if (cartLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center py-16">
            <ShoppingBag className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
            <h1 className="font-display text-3xl font-bold text-coffee mb-4 animate-fade-up">
              Your Cart is Empty
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              Looks like you haven't added any items to your cart yet. Explore our menu and discover amazing dishes!
            </p>
            <div className="space-y-4">
              <Link to="/menu">
                <Button size="lg" className="btn-coffee w-full animate-gold-shimmer">
                  Browse Menu
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline" size="lg" className="w-full animate-scale-in">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-6 pb-12">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-4xl font-bold text-coffee animate-fade-up">
                Shopping Cart
              </h1>
              <p className="text-muted-foreground mt-2">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
            {cartItems.length > 0 && (
              <Button
                variant="ghost"
                onClick={handleClearCart}
                disabled={isClearing}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Cart
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id} className="shadow-coffee">
                <CardContent className="p-6 flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-card rounded-lg flex items-center justify-center">
                      {item.menu_item?.image_url ? (
                        <img
                          src={item.menu_item.image_url}
                          alt={item.menu_item.name}
                          className="w-full h-full object-cover rounded-lg coffee-card"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling!.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <span className="text-2xl opacity-50">🍽️</span>
                      )}
                      <span
                        className="text-2xl opacity-50"
                        style={{ display: 'none' }}
                      >
                        🍽️
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg font-semibold text-coffee">
                      {item.menu_item?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {item.menu_item?.description}
                    </p>
                    <p className="font-display font-bold text-gold mt-2">
                      ${item.menu_item?.price.toFixed(2)}
                    </p>
                    {item.special_requests && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Special: {item.special_requests}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="font-medium text-coffee w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="hidden lg:block text-right min-w-0">
                    <div className="font-display font-bold text-gold">
                      <span className="text-coffee">Item Total: </span>
                      ${(item.menu_item?.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-1">
            <Card className="coffee-card sticky top-24 shadow-coffee">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-display text-xl font-semibold text-coffee">Order Summary</h2>
                <div className="space-y-2">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.menu_item?.name} × {item.quantity}
                      </span>
                      <span className="font-medium">
                        ${(item.menu_item?.price * item.quantity).toFixed(2)}
                      </span>
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
                <Button
                  size="lg"
                  className="btn-coffee w-full mt-6 animate-gold-shimmer"
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                </Button>
                <Link to="/menu">
                  <Button variant="outline" size="lg" className="w-full mt-2 animate-scale-in">
                    Continue Shopping
                  </Button>
                </Link>
                <div className="bg-accent/10 p-4 rounded-lg mt-6">
                  <p className="text-sm text-muted-foreground text-center">
                    🚚 Free delivery on orders over $25
                    <br />
                    ⏱️ Estimated delivery: 25-35 mins
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};