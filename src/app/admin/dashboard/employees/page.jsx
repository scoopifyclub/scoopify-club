'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchIcon, RefreshCcw, MailIcon, PhoneIcon, CheckIcon, XIcon } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { scooperApprovalState } from '@/lib/scooper-approval';

const FILTERS = [
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'inactive', label: 'Inactive' },
    { id: 'all', label: 'All' },
];

const STATE_BADGE = {
    pending: { label: 'Pending approval', className: 'bg-yellow-100 text-yellow-800' },
    approved: { label: 'Approved', className: 'bg-green-100 text-green-800' },
    inactive: { label: 'Inactive', className: 'bg-gray-100 text-gray-700' },
};

function fullName(employee) {
    const name = [employee.user?.firstName, employee.user?.lastName].filter(Boolean).join(' ');
    return name || employee.user?.email || 'Unnamed scooper';
}

function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : format(date, 'MMM d, yyyy');
}

export default function EmployeesPage() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('pending');
    const [busyId, setBusyId] = useState(null);

    const fetchEmployees = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/employees', { credentials: 'include' });
            if (!response.ok) {
                throw new Error('Failed to fetch scoopers');
            }
            const data = await response.json();
            setEmployees(Array.isArray(data) ? data : []);
            setError(null);
        } catch (err) {
            console.error('Error fetching scoopers:', err);
            setError('Failed to fetch scoopers');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    const counts = useMemo(() => {
        const result = { pending: 0, approved: 0, inactive: 0, all: employees.length };
        for (const employee of employees) result[scooperApprovalState(employee)] += 1;
        return result;
    }, [employees]);

    const visible = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        return employees.filter((employee) => {
            if (filter !== 'all' && scooperApprovalState(employee) !== filter) return false;
            if (!query) return true;
            return [fullName(employee), employee.user?.email, employee.phone]
                .some((value) => value && value.toLowerCase().includes(query));
        });
    }, [employees, filter, searchTerm]);

    const changeApproval = async (employee, approve) => {
        const name = fullName(employee);
        if (!approve) {
            const verb = scooperApprovalState(employee) === 'pending' ? 'Reject' : 'Deactivate';
            if (!window.confirm(`${verb} ${name}? They will not be able to see or claim jobs.`)) return;
        }
        setBusyId(employee.id);
        try {
            const response = await fetch(`/api/admin/employees/${employee.id}/approval`, {
                method: approve ? 'POST' : 'DELETE',
                credentials: 'include',
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }
            if (approve) {
                toast.success(`${name} approved${data.emailSent ? ' and emailed' : ''}`);
            } else if (data.activeJobs > 0) {
                toast.warning(`${name} deactivated. They still hold ${data.activeJobs} active job(s); reassign or cancel them.`);
            } else {
                toast.success(`${name} deactivated`);
            }
            setEmployees((prev) => prev.map((item) => (item.id === employee.id ? { ...item, ...data.employee } : item)));
        } catch (err) {
            toast.error(err.message || 'Failed to update scooper');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Scoopers</h1>
                <p className="text-muted-foreground">
                    Approve new scoopers after vetting. Only approved scoopers can see and claim jobs.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                        <CardTitle>Scooper list</CardTitle>
                        <div className="relative w-full md:w-64">
                            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"/>
                            <Input
                                placeholder="Search name, email, phone..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2" role="tablist" aria-label="Filter scoopers">
                        {FILTERS.map((item) => (
                            <Button
                                key={item.id}
                                role="tab"
                                aria-selected={filter === item.id}
                                size="sm"
                                variant={filter === item.id ? 'default' : 'outline'}
                                onClick={() => setFilter(item.id)}
                            >
                                {item.label} ({counts[item.id]})
                            </Button>
                        ))}
                    </div>
                </CardHeader>
                <CardContent>
                    {error ? (
                        <div className="p-4 text-red-600">{error}</div>
                    ) : (
                        <div className="rounded-md border">
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b">
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground hidden md:table-cell">Contact</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground hidden md:table-cell">Coverage</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0">
                                        {visible.map((employee) => {
                                            const state = scooperApprovalState(employee);
                                            const badge = STATE_BADGE[state];
                                            const zips = (employee.serviceAreas || []).filter((area) => area.active !== false);
                                            const busy = busyId === employee.id;
                                            return (
                                                <tr key={employee.id} className="border-b">
                                                    <td className="p-4 align-middle">
                                                        <div className="font-medium">{fullName(employee)}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Signed up {formatDate(employee.createdAt)}
                                                            {' · '}{employee.completedJobs ?? 0} jobs done
                                                        </div>
                                                        <div className="text-xs text-muted-foreground md:hidden">{employee.user?.email}</div>
                                                    </td>
                                                    <td className="p-4 align-middle hidden md:table-cell">
                                                        <div className="flex items-center text-xs">
                                                            <MailIcon className="h-3 w-3 mr-2 text-muted-foreground"/>
                                                            {employee.user?.email || '—'}
                                                        </div>
                                                        <div className="flex items-center text-xs mt-1">
                                                            <PhoneIcon className="h-3 w-3 mr-2 text-muted-foreground"/>
                                                            {employee.phone || '—'}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-middle hidden md:table-cell text-xs">
                                                        {zips.length === 0
                                                            ? <span className="text-muted-foreground">No coverage set</span>
                                                            : zips.map((area) => `${area.zipCode} (${area.travelDistance} mi)`).join(', ')}
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <Badge className={badge.className}>{badge.label}</Badge>
                                                        {state === 'approved' && (
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                since {formatDate(employee.approvedAt)}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-4 align-middle text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {state !== 'approved' && (
                                                                <Button size="sm" disabled={busy} onClick={() => changeApproval(employee, true)}>
                                                                    <CheckIcon className="h-4 w-4 mr-1"/>
                                                                    {state === 'pending' ? 'Approve' : 'Reactivate'}
                                                                </Button>
                                                            )}
                                                            {state !== 'inactive' && (
                                                                <Button size="sm" variant="outline" disabled={busy} onClick={() => changeApproval(employee, false)}>
                                                                    <XIcon className="h-4 w-4 mr-1"/>
                                                                    {state === 'pending' ? 'Reject' : 'Deactivate'}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {!loading && visible.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="p-4 text-center text-muted-foreground">
                                                    {filter === 'pending' ? 'No scoopers waiting for approval.' : 'No scoopers found.'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-end space-x-2 py-4">
                        <div className="flex-1 text-sm text-muted-foreground">
                            Showing <strong>{visible.length}</strong> of <strong>{employees.length}</strong> scoopers
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchEmployees} disabled={loading}>
                            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}/>
                            {loading ? 'Refreshing...' : 'Refresh'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
