'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [marketingItems, setMarketingItems] = useState([]);
    const [orderHistory, setOrderHistory] = useState([]);
    const [cart, setCart] = useState([]);
    const [isClient, setIsClient] = useState(false);
    const { user, loading } = useAuth({
        required: true,
        role: 'EMPLOYEE',
        redirectTo: '/auth/signin'
    });

    const [referralCode, setReferralCode] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const { data: session, status } = useSession({
        required: true,
        onUnauthenticated() {
            router.push('/auth/login?callbackUrl=/employee/dashboard/marketing');
        },
    });

    // Set isClient to true on mount
    useEffect(() => {
        setIsClient(true);
    }, []);

    // If not client-side yet, show nothing to prevent hydration mismatch
    if (!isClient) {
        return null;
    }

    // If still loading session, show loading state
    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    // If no session or wrong role, this will redirect (handled by useSession)
    if (!session || session.user?.role !== 'EMPLOYEE') {
        return null;
    }

    useEffect(() => {
        // Fetch marketing materials and order history
        fetchMarketingItems();
        fetchOrderHistory();
        setIsLoading(false);
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
        }
        catch (error) {
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
        }
        catch (error) {
            console.error('Error fetching order history:', error);
            toast.error('Failed to load order history');
        }
    };

    const addToCart = (itemId) => {
        const existingItem = cart.find(item => item.itemId === itemId);
        if (existingItem) {
            setCart(cart.map(item => item.itemId === itemId
                ? Object.assign(Object.assign({}, item), { quantity: item.quantity + 1 }) : item));
        }
        else {
            setCart([...cart, { itemId, quantity: 1 }]);
        }
        toast.success('Added to cart');
    };

    const removeFromCart = (itemId) => {
        const existingItem = cart.find(item => item.itemId === itemId);
        if (existingItem && existingItem.quantity > 1) {
            setCart(cart.map(item => item.itemId === itemId
                ? Object.assign(Object.assign({}, item), { quantity: item.quantity - 1 }) : item));
        }
        else {
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
            // Here you would make an API call to place the order
            toast.success('Order placed successfully!');
            // In a real app, you would refresh data after successful order
            // For demo, we'll just clear the cart and update the order history
            const newOrder = {
                id: `ORD-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                date: new Date().toISOString().split('T')[0],
                status: 'processing',
                total: parseFloat(calculateTotal()),
                items: cart.map(cartItem => {
                    const item = marketingItems.find(mi => mi.id === cartItem.itemId);
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
        }
        catch (error) {
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
                method: 'POST',
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to generate referral code');
            }

            const data = await response.json();
            setReferralCode(data.code);
            toast.success('Referral code generated successfully');
        } catch (error) {
            console.error('Error generating referral code:', error);
            toast.error('Failed to generate referral code');
        } finally {
            setIsGenerating(false);
        }
    };

    if (loading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Marketing Tools</h1>
            
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Your Referral Code</h2>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="referralCode">Current Referral Code</Label>
                        <div className="flex gap-2">
                            <Input
                                id="referralCode"
                                value={referralCode}
                                readOnly
                                placeholder="Generate a referral code"
                            />
                            <Button 
                                onClick={generateReferralCode}
                                disabled={isGenerating}
                            >
                                {isGenerating ? 'Generating...' : 'Generate'}
                            </Button>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600">
                        Share this code with potential customers. You'll earn a bonus for each successful referral!
                    </p>
                </div>
            </Card>

            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Marketing Materials</h2>
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Download and share these materials to promote your services:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button variant="outline" className="w-full">
                            Download Business Cards
                        </Button>
                        <Button variant="outline" className="w-full">
                            Download Flyers
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
