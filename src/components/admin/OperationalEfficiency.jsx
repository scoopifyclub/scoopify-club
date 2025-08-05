'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Route, 
    Package, 
    CheckCircle, 
    MessageSquare, 
    TrendingUp,
    Clock,
    MapPin,
    Star
} from 'lucide-react';

export default function OperationalEfficiency() {
    const [activeTab, setActiveTab] = useState('overview');
    const [inventory, setInventory] = useState([]);
    const [qualityRecords, setQualityRecords] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [routeOptimizations, setRouteOptimizations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOperationalData();
    }, []);

    const fetchOperationalData = async () => {
        try {
            setLoading(true);
            
            // Fetch inventory data
            const inventoryRes = await fetch('/api/inventory');
            if (inventoryRes.ok) {
                const inventoryData = await inventoryRes.json();
                setInventory(inventoryData.inventory || []);
            }

            // Fetch quality control data
            const qualityRes = await fetch('/api/quality-control');
            if (qualityRes.ok) {
                const qualityData = await qualityRes.json();
                setQualityRecords(qualityData.records || []);
            }

            // Fetch feedback data
            const feedbackRes = await fetch('/api/feedback');
            if (feedbackRes.ok) {
                const feedbackData = await feedbackRes.json();
                setFeedback(feedbackData.feedback || []);
            }

        } catch (error) {
            console.error('Error fetching operational data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getInventoryAlerts = () => {
        return inventory.filter(item => item.quantity <= item.minQuantity);
    };

    const getAverageRating = () => {
        if (feedback.length === 0) return 0;
        const total = feedback.reduce((sum, f) => sum + f.rating, 0);
        return Math.round((total / feedback.length) * 10) / 10;
    };

    const getQualityScore = () => {
        if (qualityRecords.length === 0) return 100;
        const completed = qualityRecords.filter(r => r.status === 'COMPLETED').length;
        return Math.round((completed / qualityRecords.length) * 100);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">Operational Efficiency</h2>
                <Button onClick={fetchOperationalData} variant="outline">
                    Refresh Data
                </Button>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{inventory.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {getInventoryAlerts().length} items need restocking
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{getQualityScore()}%</div>
                        <p className="text-xs text-muted-foreground">
                            {qualityRecords.length} quality checks completed
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Customer Rating</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{getAverageRating()}/5</div>
                        <p className="text-xs text-muted-foreground">
                            {feedback.length} feedback submissions
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Route Efficiency</CardTitle>
                        <Route className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">85%</div>
                        <p className="text-xs text-muted-foreground">
                            Average route optimization
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="inventory">Inventory</TabsTrigger>
                    <TabsTrigger value="quality">Quality Control</TabsTrigger>
                    <TabsTrigger value="feedback">Customer Feedback</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Recent Quality Issues */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5" />
                                    Recent Quality Issues
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {qualityRecords.filter(r => r.status !== 'COMPLETED').length === 0 ? (
                                    <p className="text-green-600">No quality issues found</p>
                                ) : (
                                    <div className="space-y-2">
                                        {qualityRecords
                                            .filter(r => r.status !== 'COMPLETED')
                                            .slice(0, 5)
                                            .map((record) => (
                                                <div key={record.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                                                    <span className="text-sm">Service #{record.serviceId}</span>
                                                    <Badge variant="destructive">{record.status}</Badge>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Low Stock Alerts */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    Low Stock Alerts
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {getInventoryAlerts().length === 0 ? (
                                    <p className="text-green-600">All inventory levels are adequate</p>
                                ) : (
                                    <div className="space-y-2">
                                        {getInventoryAlerts().slice(0, 5).map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                                                <span className="text-sm">{item.name}</span>
                                                <Badge variant="secondary">{item.quantity} {item.unit}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="inventory" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Inventory Management
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2">Item</th>
                                            <th className="text-left p-2">Category</th>
                                            <th className="text-left p-2">Quantity</th>
                                            <th className="text-left p-2">Min Qty</th>
                                            <th className="text-left p-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inventory.map((item) => (
                                            <tr key={item.id} className="border-b">
                                                <td className="p-2">{item.name}</td>
                                                <td className="p-2">{item.category}</td>
                                                <td className="p-2">{item.quantity} {item.unit}</td>
                                                <td className="p-2">{item.minQuantity}</td>
                                                <td className="p-2">
                                                    {item.quantity <= item.minQuantity ? (
                                                        <Badge variant="destructive">Low Stock</Badge>
                                                    ) : (
                                                        <Badge variant="default">In Stock</Badge>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="quality" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5" />
                                Quality Control Records
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {qualityRecords.slice(0, 10).map((record) => (
                                    <div key={record.id} className="border rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">Service #{record.serviceId}</span>
                                                <Badge variant={record.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                                    {record.status}
                                                </Badge>
                                            </div>
                                            <span className="text-sm text-muted-foreground">
                                                {new Date(record.completionTime).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {record.notes && (
                                            <p className="text-sm text-muted-foreground">{record.notes}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="feedback" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                Customer Feedback
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {feedback.slice(0, 10).map((item) => (
                                    <div key={item.id} className="border rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">Service #{item.serviceId}</span>
                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`h-4 w-4 ${
                                                                i < item.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <Badge variant="outline">{item.category}</Badge>
                                        </div>
                                        {item.review && (
                                            <p className="text-sm text-muted-foreground">{item.review}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 