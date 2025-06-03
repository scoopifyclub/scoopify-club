'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, MapPin, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function CoverageManagementPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth({ required: true, role: 'ADMIN' });
    const [loading, setLoading] = useState(true);
    const [coverageAreas, setCoverageAreas] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (!authLoading && user) {
            fetchCoverageAreas();
        }
    }, [user, authLoading]);

    const fetchCoverageAreas = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/coverage-areas', {
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to fetch coverage areas');
            }

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch coverage areas');
            }

            // Transform the data to match the expected structure
            const transformedAreas = data.coverageAreas?.map(area => ({
                id: area.id,
                zipCode: area.zipCode,
                status: area.status,
                employeeName: area.employee?.User?.name || 'Unassigned',
                employeeEmail: area.employee?.User?.email || 'N/A',
                lastUpdated: area.updatedAt,
                notes: area.notes || ''
            })) || [];

            setCoverageAreas(transformedAreas);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to load coverage areas', {
                description: error.message
            });
            setCoverageAreas([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchCoverageAreas();
            toast.success('Coverage areas refreshed');
        } catch (error) {
            // Error already handled in fetchCoverageAreas
        } finally {
            setRefreshing(false);
        }
    };

    const filteredAreas = coverageAreas.filter(area => {
        const matchesSearch = 
            area.zipCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            area.employeeName?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || area.status === (statusFilter === 'active');
        return matchesSearch && matchesStatus;
    });

    if (loading || authLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Coverage Area Management</h1>
                    <p className="text-gray-500 mt-2">
                        Manage service coverage areas and employee assignments
                    </p>
                </div>
                <Button onClick={handleRefresh} disabled={refreshing}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Coverage Areas</CardTitle>
                    <CardDescription>
                        View and manage service coverage areas across different ZIP codes
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by ZIP code or employee..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <select
                            className="w-full md:w-48 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ZIP Code</TableHead>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Travel Distance</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Updated</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAreas.map((area) => (
                                    <TableRow key={area.id}>
                                        <TableCell className="font-medium">{area.zipCode}</TableCell>
                                        <TableCell>{area.employeeName || 'Unassigned'}</TableCell>
                                        <TableCell>{area.travelDistance} miles</TableCell>
                                        <TableCell>
                                            <Badge variant={area.status === 'active' ? "success" : "secondary"}>
                                                {area.status === 'active' ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(area.lastUpdated).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.push(`/admin/dashboard/coverage/${area.id}`)}
                                            >
                                                Manage
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredAreas.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-4">
                                            No coverage areas found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 