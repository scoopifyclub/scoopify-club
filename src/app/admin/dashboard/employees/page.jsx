'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, SearchIcon, RefreshCcw, MoreHorizontalIcon, UserIcon, MailIcon, PhoneIcon, BriefcaseIcon, StarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function EmployeesPage() {
    const { user, status } = useAuth({ required: true, role: 'ADMIN', redirectTo: '/admin/login' });
    const router = useRouter();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Move all useEffect hooks to the top before any early returns
    useEffect(() => {
        if (status === 'authenticated') {
            fetchEmployees();
        }
    }, [status]);

    useEffect(() => {
        // Filter employees when search query changes
        if (searchTerm) {
            const query = searchTerm.toLowerCase();
            const filtered = employees.filter(employee => 
                employee.name.toLowerCase().includes(query) ||
                employee.email.toLowerCase().includes(query) ||
                employee.role.toLowerCase().includes(query)
            );
            setEmployees(filtered);
        } else {
            setEmployees(employees);
        }
    }, [searchTerm, employees]);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/employees', {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch employees');
            }

            const data = await response.json();
            setEmployees(data);
            toast.success('Employee list updated');
        } catch (error) {
            console.error('Error fetching employees:', error);
            toast.error('Failed to fetch employees');
            setError('Failed to fetch employees');
        } finally {
            setLoading(false);
        }
    };

    // Show loading state while auth is being checked
    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-lg">Loading employees...</p>
                </div>
            </div>
        );
    }

    // Redirect if not admin
    if (status === 'unauthenticated' || (user && user.role !== 'ADMIN')) {
        router.push('/admin/login');
        return null;
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'inactive':
                return 'bg-red-100 text-red-800';
            case 'on_leave':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatStatus = (status) => {
        return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const handleViewEmployee = (employeeId) => {
        router.push(`/admin/dashboard/employees/${employeeId}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
                    <p className="text-muted-foreground">
                        Manage employee accounts, assignments, and performance
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        onClick={() => router.push('/admin/dashboard/employees/add')} 
                        className="whitespace-nowrap"
                    >
                        <PlusIcon className="h-4 w-4 mr-2"/>
                        Add Employee
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                        <CardTitle>Employee List</CardTitle>
                        <div className="relative w-full md:w-64">
                            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"/>
                            <Input 
                                placeholder="Search employees..." 
                                className="pl-8" 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground hidden md:table-cell">Contact</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Role</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Performance</th>
                                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {employees.map((employee) => (
                                        <tr 
                                            key={employee.id} 
                                            className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer" 
                                            onClick={() => handleViewEmployee(employee.id)}
                                        >
                                            <td className="p-4 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-full bg-muted h-8 w-8 flex items-center justify-center">
                                                        <UserIcon className="h-4 w-4"/>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{employee.name}</div>
                                                        <div className="text-xs text-muted-foreground md:hidden">{employee.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle hidden md:table-cell">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center">
                                                        <MailIcon className="h-3 w-3 mr-2 text-muted-foreground"/>
                                                        <span className="text-xs">{employee.email}</span>
                                                    </div>
                                                    <div className="flex items-center mt-1">
                                                        <PhoneIcon className="h-3 w-3 mr-2 text-muted-foreground"/>
                                                        <span className="text-xs">{employee.phone}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="flex items-center">
                                                    <BriefcaseIcon className="h-3 w-3 mr-2 text-muted-foreground"/>
                                                    {employee.role}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    Since {format(new Date(employee.hireDate), 'MMM yyyy')}
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <Badge className={getStatusColor(employee.status)}>
                                                    {formatStatus(employee.status)}
                                                </Badge>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="flex items-center">
                                                    <StarIcon className="h-3 w-3 mr-1 text-yellow-500 fill-yellow-500"/>
                                                    <span className="font-medium">{employee.rating.toFixed(1)}</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {employee.completedServices} services
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Additional actions menu could be added here
                                                    }}
                                                >
                                                    <MoreHorizontalIcon className="h-4 w-4"/>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}

                                    {employees.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-4 text-center text-muted-foreground">
                                                No employees found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2 py-4">
                        <div className="flex-1 text-sm text-muted-foreground">
                            Showing <strong>{employees.length}</strong> of <strong>{employees.length}</strong> employees
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={fetchEmployees}
                            disabled={loading}
                        >
                            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}/>
                            {loading ? 'Refreshing...' : 'Refresh'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
