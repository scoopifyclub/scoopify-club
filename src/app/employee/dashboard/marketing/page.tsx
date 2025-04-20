'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShoppingCart, Package, History, Info, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

interface MarketingItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  minOrder: number;
  stock: number;
}

interface OrderHistoryItem {
  id: string;
  date: string;
  status: 'processing' | 'shipped' | 'delivered';
  total: number;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
  }[];
}

interface CartItem {
  itemId: string;
  quantity: number;
}

export default function MarketingMaterialsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [marketingItems, setMarketingItems] = useState<MarketingItem[]>([]);
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/employee/dashboard/marketing');
      return;
    }
    
    if (status === 'authenticated') {
      if (session?.user?.role !== 'EMPLOYEE') {
        router.push('/');
        return;
      }
      
      // Fetch marketing materials and order history
      fetchMarketingItems();
      fetchOrderHistory();
      setIsLoading(false);
    }
  }, [session, status, router]);

  const fetchMarketingItems = async () => {
    try {
      // In a real app, fetch from API
      // Mock data for demonstration
      setMarketingItems([
        {
          id: '1',
          name: 'Business Cards',
          description: 'High-quality business cards with your name and contact info. Pack of 100.',
          price: 15.00,
          image: '/images/business-cards.jpg',
          minOrder: 1,
          stock: 50
        },
        {
          id: '2',
          name: 'Flyers',
          description: 'Colorful flyers highlighting our cleaning services. Pack of 50.',
          price: 12.50,
          image: '/images/flyers.jpg',
          minOrder: 1,
          stock: 30
        },
        {
          id: '3',
          name: 'Yard Signs',
          description: 'Weather-resistant yard signs with stakes. "Professional Cleaning Services Available" with logo.',
          price: 25.00,
          image: '/images/yard-signs.jpg',
          minOrder: 1,
          stock: 20
        },
        {
          id: '4',
          name: 'Branded T-Shirts',
          description: 'Company logo t-shirts in various sizes. Great for brand visibility.',
          price: 18.00,
          image: '/images/tshirts.jpg',
          minOrder: 1,
          stock: 40
        },
        {
          id: '5',
          name: 'Customer Referral Cards',
          description: 'Cards with referral code that give discounts to new customers. Pack of 100.',
          price: 10.00,
          image: '/images/referral-cards.jpg',
          minOrder: 1,
          stock: 60
        }
      ]);
    } catch (error) {
      console.error('Error fetching marketing items:', error);
      toast.error('Failed to load marketing materials');
    }
  };

  const fetchOrderHistory = async () => {
    try {
      // In a real app, fetch from API
      // Mock data for demonstration
      setOrderHistory([
        {
          id: 'ORD-001',
          date: '2023-11-15',
          status: 'delivered',
          total: 27.50,
          items: [
            { id: '1', name: 'Business Cards', quantity: 1, price: 15.00 },
            { id: '5', name: 'Customer Referral Cards', quantity: 1, price: 10.00 }
          ]
        },
        {
          id: 'ORD-002',
          date: '2023-12-03',
          status: 'shipped',
          total: 25.00,
          items: [
            { id: '3', name: 'Yard Signs', quantity: 1, price: 25.00 }
          ]
        }
      ]);
    } catch (error) {
      console.error('Error fetching order history:', error);
      toast.error('Failed to load order history');
    }
  };

  const addToCart = (itemId: string) => {
    const existingItem = cart.find(item => item.itemId === itemId);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.itemId === itemId 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, { itemId, quantity: 1 }]);
    }
    
    toast.success('Added to cart');
  };

  const removeFromCart = (itemId: string) => {
    const existingItem = cart.find(item => item.itemId === itemId);
    
    if (existingItem && existingItem.quantity > 1) {
      setCart(cart.map(item => 
        item.itemId === itemId 
          ? { ...item, quantity: item.quantity - 1 } 
          : item
      ));
    } else {
      setCart(cart.filter(item => item.itemId !== itemId));
    }
    
    toast.success('Removed from cart');
  };

  const getCartItemCount = (itemId: string) => {
    const item = cart.find(item => item.itemId === itemId);
    return item ? item.quantity : 0;
  };

  const calculateTotal = () => {
    return cart.reduce((total, cartItem) => {
      const item = marketingItems.find(mi => mi.id === cartItem.itemId);
      return total + (item ? item.price * cartItem.quantity : 0);
    }, 0).toFixed(2);
  };

  const placeOrder = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    
    try {
      // Here you would make an API call to place the order
      toast.success('Order placed successfully!');
      
      // In a real app, you would refresh data after successful order
      // For demo, we'll just clear the cart and update the order history
      const newOrder: OrderHistoryItem = {
        id: `ORD-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        date: new Date().toISOString().split('T')[0],
        status: 'processing',
        total: parseFloat(calculateTotal()),
        items: cart.map(cartItem => {
          const item = marketingItems.find(mi => mi.id === cartItem.itemId)!;
          return {
            id: item.id,
            name: item.name,
            quantity: cartItem.quantity,
            price: item.price
          };
        })
      };
      
      setOrderHistory([newOrder, ...orderHistory]);
      setCart([]);
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'bg-yellow-200 text-yellow-800';
      case 'shipped': return 'bg-blue-200 text-blue-800';
      case 'delivered': return 'bg-green-200 text-green-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Marketing Materials</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => router.refresh()}>
            Refresh
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
          <TabsTrigger value="cart">
            Cart
            {cart.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {cart.reduce((total, item) => total + item.quantity, 0)}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="orders">Order History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="catalog" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Browse our catalog of marketing materials to help you promote your services.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketingItems.map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-2">
                  <CardTitle>{item.name}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video relative overflow-hidden rounded-md bg-muted mb-2">
                    <div className="absolute inset-0 flex items-center justify-center bg-secondary/20">
                      <Package className="h-10 w-10 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="font-medium">${item.price.toFixed(2)}</p>
                    <Badge variant={item.stock > 10 ? "secondary" : "destructive"}>
                      {item.stock > 0 ? `${item.stock} in stock` : "Out of stock"}
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="flex items-center space-x-2">
                    {getCartItemCount(item.id) > 0 && (
                      <>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span>{getCartItemCount(item.id)}</span>
                      </>
                    )}
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => addToCart(item.id)}
                      disabled={item.stock === 0}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    onClick={() => addToCart(item.id)}
                    disabled={item.stock === 0}
                  >
                    Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="cart">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Your cart is empty</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add some marketing materials to place an order.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your Cart</CardTitle>
                  <CardDescription>
                    Review your order before checking out
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="divide-y">
                    {cart.map((cartItem) => {
                      const item = marketingItems.find(mi => mi.id === cartItem.itemId)!;
                      return (
                        <div key={cartItem.itemId} className="py-3 flex justify-between items-center">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              ${item.price.toFixed(2)} x {cartItem.quantity}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span>{cartItem.quantity}</span>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => addToCart(item.id)}
                              disabled={item.stock <= cartItem.quantity}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col items-stretch space-y-4">
                  <div className="flex justify-between items-center py-2 font-medium">
                    <span>Total:</span>
                    <span>${calculateTotal()}</span>
                  </div>
                  <Button onClick={placeOrder}>Place Order</Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="orders">
          {orderHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <History className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No order history</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your order history will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orderHistory.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">Order #{order.id}</CardTitle>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                    <CardDescription>
                      Ordered on {new Date(order.date).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="divide-y">
                      {order.items.map((item) => (
                        <div key={item.id} className="py-2 flex justify-between">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              ${item.price.toFixed(2)} x {item.quantity}
                            </p>
                          </div>
                          <p className="font-medium">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <p className="text-sm text-muted-foreground">
                      {order.items.reduce((total, item) => total + item.quantity, 0)}{" "}
                      items total
                    </p>
                    <p className="font-medium">Total: ${order.total.toFixed(2)}</p>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 