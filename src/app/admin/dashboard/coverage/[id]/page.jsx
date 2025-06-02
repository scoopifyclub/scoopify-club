'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';

export default function CoverageAreaDetailPage({ params }) {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth({ required: true, role: 'ADMIN' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [coverageArea, setCoverageArea] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [formData, setFormData] = useState({
        employeeId: '',
        travelDistance: '',
        active: true
    });

    useEffect(() => {
        if (!authLoading && user) {
            fetchCoverageArea();
            fetchEmployees();
        }
    }, [user, authLoading, params.id]);

    const fetchCoverageArea = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/coverage-areas/${params.id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch coverage area');
            }
            const data = await response.json();
            setCoverageArea(data);
            setFormData({
                employeeId: data.employeeId,
                travelDistance: data.travelDistance.toString(),
                active: data.active
            });
        } catch (error) {
            toast.error('Error loading coverage area');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await fetch('/api/admin/employees');
            if (!response.ok) {
                throw new Error('Failed to fetch employees');
            }
            const data = await response.json();
            setEmployees(data);
        } catch (error) {
            toast.error('Error loading employees');
            console.error('Error:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const response = await fetch(`/api/admin/coverage-areas/${params.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.details || error.error || 'Failed to update coverage area');
            }

            const updatedArea = await response.json();
            setCoverageArea(updatedArea);
            toast.success('Coverage area updated successfully');
        } catch (error) {
            toast.error(error.message);
            console.error('Error:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            const response = await fetch(`/api/admin/coverage-areas/${params.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete coverage area');
            }

            toast.success('Coverage area deleted successfully');
            router.push('/admin/dashboard/coverage');
        } catch (error) {
            toast.error('Error deleting coverage area');
            console.error('Error:', error);
        } finally {
            setDeleting(false);
        }
    };

    if (loading || authLoading) {
        return <LoadingSpinner />;
    }

    if (!coverageArea) {
        return (
            <div className="container mx-auto py-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600">Coverage Area Not Found</h1>
                    <p className="mt-2 text-gray-600">The requested coverage area could not be found.</p>
                    <Button
                        className="mt-4"
                        onClick={() => router.push('/admin/dashboard/coverage')}
                    >
                        Back to Coverage Areas
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/admin/dashboard/coverage')}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Coverage Area Details</h1>
                        <p className="text-gray-500 mt-1">
                            ZIP Code: {coverageArea.zipCode}
                        </p>
                    </div>
                </div>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={deleting}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            {deleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the coverage area
                                for ZIP code {coverageArea.zipCode}.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Edit Coverage Area</CardTitle>
                    <CardDescription>
                        Update the coverage area details and assignment
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="employeeId">Assigned Employee</Label>
                                <Select
                                    value={formData.employeeId}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an employee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees.map((employee) => (
                                            <SelectItem key={employee.id} value={employee.id}>
                                                {employee.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="travelDistance">Travel Distance (miles)</Label>
                                <Input
                                    id="travelDistance"
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={formData.travelDistance}
                                    onChange={(e) => setFormData(prev => ({ ...prev, travelDistance: e.target.value }))}
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="active"
                                    checked={formData.active}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                                />
                                <Label htmlFor="active">Active</Label>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push('/admin/dashboard/coverage')}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving}>
                                <Save className="h-4 w-4 mr-2" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
} 