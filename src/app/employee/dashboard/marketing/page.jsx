'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShoppingCart, Package, History, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function MarketingPage() {
    const { user, loading: authLoading } = useAuth({ 
        requiredRole: 'EMPLOYEE',
        redirectTo: '/auth/login?callbackUrl=/employee/dashboard/marketing'
    });

    const [isLoading, setIsLoading] = useState(true);
    const [marketingItems, setMarketingItems] = useState([]);
    const [orderHistory, setOrderHistory] = useState([]);
    const [cart, setCart] = useState([]);
    const [isClient, setIsClient] = useState(false);
    const [referralCode, setReferralCode] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Set isClient to true on mount
    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            
            try {
                setIsLoading(true);
                await Promise.all([
                    fetchMarketingItems(),
                    fetchOrderHistory()
                ]);
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load some data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const fetchMarketingItems = async () => {
        try {
            const response = await fetch('/api/employee/marketing/items');
            
            if (!response.ok) {
                throw new Error('Failed to fetch marketing items');
            }

            const data = await response.json();
            setMarketingItems(data);
        } catch (error) {
            console.error('Error fetching marketing items:', error);
            toast.error('Failed to load marketing materials');
            
            // Fallback to mock data in development
            if (process.env.NODE_ENV === 'development') {
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
            }
        }
    };

    const fetchOrderHistory = async () => {
        try {
            const response = await fetch('/api/employee/marketing/orders');
            
            if (!response.ok) {
                throw new Error('Failed to fetch order history');
            }

            const data = await response.json();
            setOrderHistory(data);
        } catch (error) {
            console.error('Error fetching order history:', error);
            toast.error('Failed to load order history');
            
            // Fallback to mock data in development
            if (process.env.NODE_ENV === 'development') {
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
            }
        }
    };

    const addToCart = (itemId) => {
        const item = marketingItems.find(item => item.id === itemId);
        if (!item) return;

        const existingItem = cart.find(cartItem => cartItem.itemId === itemId);
        if (existingItem) {
            if (existingItem.quantity >= item.stock) {
                toast.error('Maximum stock limit reached');
                return;
            }
            setCart(cart.map(cartItem => 
                cartItem.itemId === itemId
                    ? { ...cartItem, quantity: cartItem.quantity + 1 }
                    : cartItem
            ));
        } else {
            setCart([...cart, { itemId, quantity: 1 }]);
        }
        toast.success('Added to cart');
    };

    const removeFromCart = (itemId) => {
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

    const getCartItemCount = (itemId) => {
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
            const response = await fetch('/api/employee/marketing/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items: cart.map(cartItem => ({
                        itemId: cartItem.itemId,
                        quantity: cartItem.quantity
                    }))
                })
            });

            if (!response.ok) {
                throw new Error('Failed to place order');
            }

            const newOrder = await response.json();
            setOrderHistory([newOrder, ...orderHistory]);
            setCart([]);
            toast.success('Order placed successfully!');
        } catch (error) {
            console.error('Error placing order:', error);
            toast.error('Failed to place order. Please try again.');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'processing': return 'bg-yellow-200 text-yellow-800';
            case 'shipped': return 'bg-blue-200 text-blue-800';
            case 'delivered': return 'bg-green-200 text-green-800';
            default: return 'bg-gray-200 text-gray-800';
        }
    };

    const generateReferralCode = async () => {
        setIsGenerating(true);
        try {
            const response = await fetch('/api/employee/referral-code', {
                method: 'POST'
            });
            
            if (!response.ok) {
                throw new Error('Failed to generate referral code');
            }

            const data = await response.json();
            setReferralCode(data.code);
            toast.success('Referral code generated successfully!');
        } catch (error) {
            console.error('Error generating referral code:', error);
            toast.error('Failed to generate referral code');
        } finally {
            setIsGenerating(false);
        }
    };

    // If not client-side yet, show nothing to prevent hydration mismatch
    if (!isClient) {
        return null;
    }

    if (authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Marketing Materials</h1>
                <p className="text-gray-500">Order marketing materials and manage your referral program</p>
            </div>

            <Tabs defaultValue="materials" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="materials">
                        <Package className="h-4 w-4 mr-2" />
                        Materials
                    </TabsTrigger>
                    <TabsTrigger value="orders">
                        <History className="h-4 w-4 mr-2" />
                        Order History
                    </TabsTrigger>
                    <TabsTrigger value="referrals">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Referrals
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="materials" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {marketingItems.map((item) => (
                            <Card key={item.id}>
                                <CardHeader>
                                    <CardTitle>{item.name}</CardTitle>
                                    <CardDescription>{item.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="aspect-square relative bg-gray-100 rounded-lg mb-4">
                                        {/* Image placeholder */}
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                            <Package className="h-12 w-12" />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-lg font-semibold">${item.price.toFixed(2)}</p>
                                        <Badge variant="outline">Stock: {item.stock}</Badge>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => removeFromCart(item.id)}
                                            disabled={getCartItemCount(item.id) === 0}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="w-8 text-center">{getCartItemCount(item.id)}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => addToCart(item.id)}
                                            disabled={getCartItemCount(item.id) >= item.stock}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Button
                                        variant="default"
                                        onClick={() => addToCart(item.id)}
                                        disabled={getCartItemCount(item.id) >= item.stock}
                                    >
                                        Add to Cart
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>

                    {cart.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Shopping Cart</CardTitle>
                                <CardDescription>Review your order before checkout</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {cart.map((cartItem) => {
                                        const item = marketingItems.find(mi => mi.id === cartItem.itemId);
                                        return (
                                            <div key={cartItem.itemId} className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium">{item.name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        Quantity: {cartItem.quantity} × ${item.price.toFixed(2)}
                                                    </p>
                                                </div>
                                                <p className="font-medium">
                                                    ${(item.price * cartItem.quantity).toFixed(2)}
                                                </p>
                                            </div>
                                        );
                                    })}
                                    <div className="pt-4 border-t">
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold">Total</p>
                                            <p className="font-semibold">${calculateTotal()}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" onClick={placeOrder}>
                                    Place Order
                                </Button>
                            </CardFooter>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="orders">
                    <div className="space-y-6">
                        {orderHistory.map((order) => (
                            <Card key={order.id}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle>Order #{order.id}</CardTitle>
                                            <CardDescription>
                                                Placed on {new Date(order.date).toLocaleDateString()}
                                            </CardDescription>
                                        </div>
                                        <Badge className={getStatusColor(order.status)}>
                                            {order.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {order.items.map((item) => (
                                            <div key={item.id} className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium">{item.name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        Quantity: {item.quantity} × ${item.price.toFixed(2)}
                                                    </p>
                                                </div>
                                                <p className="font-medium">
                                                    ${(item.price * item.quantity).toFixed(2)}
                                                </p>
                                            </div>
                                        ))}
                                        <div className="pt-4 border-t">
                                            <div className="flex justify-between items-center">
                                                <p className="font-semibold">Total</p>
                                                <p className="font-semibold">${order.total.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {orderHistory.length === 0 && (
                            <Card>
                                <CardContent className="text-center py-6">
                                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium">No orders yet</h3>
                                    <p className="text-gray-500">
                                        Your order history will appear here once you place an order.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="referrals">
                    <Card>
                        <CardHeader>
                            <CardTitle>Referral Program</CardTitle>
                            <CardDescription>
                                Generate and manage your referral codes
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Your Referral Code</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={referralCode}
                                        readOnly
                                        placeholder="Generate a code to get started"
                                    />
                                    <Button
                                        onClick={generateReferralCode}
                                        disabled={isGenerating}
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            'Generate Code'
                                        )}
                                    </Button>
                                </div>
                            </div>
                            <div className="text-sm text-gray-500">
                                <p>Share this code with potential customers to give them a discount on their first service.</p>
                                <p className="mt-2">You'll earn a bonus for each new customer who uses your code!</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
