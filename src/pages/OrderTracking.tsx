import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/types';
import { Clock, MapPin, Phone, Package, Truck, CheckCircle } from 'lucide-react';

export const OrderTracking = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchOrders();
    }
  }, [user, isAuthenticated, loading, navigate]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_items (
              id,
              name,
              price
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match Order interface
      const transformedOrders = (data || []).map(order => ({
        ...order,
        status: order.status as 'placed' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled',
        delivery_address: order.delivery_address as any, // Type assertion for Json to Address conversion
        items: order.order_items || []
      })) as Order[];
      
      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'placed': return 25;
      case 'confirmed': return 50;
      case 'preparing': return 75;
      case 'out_for_delivery': return 90;
      case 'delivered': return 100;
      default: return 0;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'placed': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'preparing': return <Package className="h-4 w-4" />;
      case 'out_for_delivery': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'placed': return 'secondary';
      case 'confirmed': return 'default';
      case 'preparing': return 'default';
      case 'out_for_delivery': return 'default';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Order Tracking</h1>

          {orders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
                <p className="text-muted-foreground mb-4">You haven't placed any orders yet.</p>
                <Button onClick={() => navigate('/menu')}>Browse Menu</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          Order #{order.order_number}
                          {getStatusIcon(order.status)}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Placed on {new Date(order.created_at).toLocaleDateString()} at{' '}
                          {new Date(order.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <Badge variant={getStatusColor(order.status)}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Order Progress</span>
                        <span>{getStatusProgress(order.status)}%</span>
                      </div>
                      <Progress value={getStatusProgress(order.status)} className="h-2" />
                    </div>

                    {/* Order Items */}
                    <div className="mb-6">
                      <h4 className="font-semibold mb-3">Items Ordered</h4>
                      <div className="space-y-2">
                        {order.order_items?.map((item, index) => (
                          <p key={index} className="text-sm text-muted-foreground">
                            {item.quantity}x {item.menu_items.name}
                          </p>
                     ))}
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="mb-6">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Delivery Address
                      </h4>
                      <div className="text-sm text-muted-foreground">
                        {typeof order.delivery_address === 'object' && order.delivery_address ? (
                          <div>
                            <p>{(order.delivery_address as any).street_address}</p>
                            <p>
                              {(order.delivery_address as any).city}, {(order.delivery_address as any).state} {(order.delivery_address as any).zip_code}
                            </p>
                          </div>
                        ) : (
                          <p>Address not available</p>
                        )}
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center text-sm">
                        <span>Subtotal:</span>
                        <span>${order.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Tax:</span>
                        <span>${order.tax_amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Delivery Fee:</span>
                        <span>${order.delivery_fee.toFixed(2)}</span>
                      </div>
                      {order.discount_amount > 0 && (
                        <div className="flex justify-between items-center text-sm text-green-600">
                          <span>Discount:</span>
                          <span>-${order.discount_amount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center font-semibold text-lg border-t pt-2 mt-2">
                        <span>Total:</span>
                        <span>${order.total_amount.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Contact Support */}
                    <div className="mt-6 pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-2">
                        Need help with your order?
                      </p>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Contact Support
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};