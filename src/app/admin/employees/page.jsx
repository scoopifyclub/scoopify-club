'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserIcon, MapPinIcon, PhoneIcon, EnvelopeIcon, PencilIcon, TrashIcon, PlusIcon, StarIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
export default function EmployeesPage() {
    var _a;
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const router = useRouter();
    // Form states
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        serviceAreas: [''] // Array of zip codes
    });
    const [editFormData, setEditFormData] = useState({});
    useEffect(() => {
        fetchEmployees();
        const interval = setInterval(fetchEmployees, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);
    const fetchEmployees = async () => {
        try {
            const response = await fetch('/api/admin/employees', {
                credentials: 'include'
            });
            if (!response.ok)
                throw new Error('Failed to fetch employees');
            const data = await response.json();
            setEmployees(data.employees);
            setError(null);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load employees');
        }
        finally {
            setLoading(false);
        }
    };
    const handleAddEmployee = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/admin/employees', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            if (!response.ok)
                throw new Error('Failed to add employee');
            toast.success('Employee added successfully');
            setShowAddForm(false);
            setFormData({
                name: '',
                email: '',
                phone: '',
                serviceAreas: ['']
            });
            fetchEmployees();
        }
        catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to add employee');
        }
    };
    const handleEditEmployee = async (e) => {
        e.preventDefault();
        if (!editingEmployee)
            return;
        try {
            const response = await fetch('/api/admin/employees', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    id: editingEmployee,
                    updates: editFormData
                })
            });
            if (!response.ok)
                throw new Error('Failed to update employee');
            toast.success('Employee updated successfully');
            setEditingEmployee(null);
            setEditFormData({});
            fetchEmployees();
        }
        catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to update employee');
        }
    };
    const handleStatusChange = async (employeeId, newStatus) => {
        try {
            const response = await fetch('/api/admin/employees', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    id: employeeId,
                    updates: { status: newStatus }
                })
            });
            if (!response.ok)
                throw new Error('Failed to update employee status');
            toast.success('Employee status updated successfully');
            fetchEmployees();
        }
        catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to update employee status');
        }
    };
    const handleDeleteEmployee = async (employeeId) => {
        if (!confirm('Are you sure you want to delete this employee?'))
            return;
        try {
            const response = await fetch(`/api/admin/employees?id=${employeeId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (!response.ok)
                throw new Error('Failed to delete employee');
            toast.success('Employee deleted successfully');
            fetchEmployees();
        }
        catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete employee');
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-green-100 text-green-800';
            case 'INACTIVE':
                return 'bg-gray-100 text-gray-800';
            case 'ON_JOB':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    const filteredEmployees = employees.filter(employee => employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.phone.includes(searchTerm));
    const removeServiceArea = (index) => {
        setFormData(prev => (Object.assign(Object.assign({}, prev), { serviceAreas: prev.serviceAreas.filter((_, i) => i !== index) })));
    };
    return (<div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
            <p className="mt-2 text-gray-600">Manage employee details, schedules, and performance</p>
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            <PlusIcon className="h-4 w-4 mr-2"/>
            Add Employee
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <Input type="text" placeholder="Search employees..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-md"/>
        </div>

        {/* Add Employee Form */}
        {showAddForm && (<div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Add New Employee</h2>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData(Object.assign(Object.assign({}, formData), { name: e.target.value }))} required/>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData(Object.assign(Object.assign({}, formData), { email: e.target.value }))} required/>
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={formData.phone} onChange={(e) => setFormData(Object.assign(Object.assign({}, formData), { phone: e.target.value }))} required/>
              </div>
              <div>
                <Label>Service Areas (Zip Codes)</Label>
                {formData.serviceAreas.map((zipCode, index) => (<div key={index} className="flex gap-2 mb-2">
                    <Input value={zipCode} onChange={(e) => {
                    const newAreas = [...formData.serviceAreas];
                    newAreas[index] = e.target.value;
                    setFormData(Object.assign(Object.assign({}, formData), { serviceAreas: newAreas }));
                }} placeholder="Enter zip code"/>
                    {index === formData.serviceAreas.length - 1 && (<Button type="button" onClick={() => setFormData(Object.assign(Object.assign({}, formData), { serviceAreas: [...formData.serviceAreas, ''] }))}>
                        Add Area
                      </Button>)}
                  </div>))}
              </div>
              <div className="flex gap-2">
                <Button type="submit">Add Employee</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>)}

        {/* Edit Employee Modal */}
        {editingEmployee && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4">Edit Employee</h2>
              <form onSubmit={handleEditEmployee} className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input id="edit-name" value={editFormData.name || ''} onChange={(e) => setEditFormData(Object.assign(Object.assign({}, editFormData), { name: e.target.value }))}/>
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" type="email" value={editFormData.email || ''} onChange={(e) => setEditFormData(Object.assign(Object.assign({}, editFormData), { email: e.target.value }))}/>
                </div>
                <div>
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input id="edit-phone" value={editFormData.phone || ''} onChange={(e) => setEditFormData(Object.assign(Object.assign({}, editFormData), { phone: e.target.value }))}/>
                </div>
                <div>
                  <Label>Service Areas (Zip Codes)</Label>
                  {(_a = editFormData.serviceAreas) === null || _a === void 0 ? void 0 : _a.map((zipCode, index) => (<div key={index} className="flex gap-2 mb-2">
                      <Input value={zipCode} onChange={(e) => {
                    const newAreas = [...(editFormData.serviceAreas || [])];
                    newAreas[index] = e.target.value;
                    setEditFormData(Object.assign(Object.assign({}, editFormData), { serviceAreas: newAreas }));
                }} placeholder="Enter zip code"/>
                      <Button type="button" variant="destructive" onClick={() => {
                    const newAreas = [...(editFormData.serviceAreas || [])];
                    newAreas.splice(index, 1);
                    setEditFormData(Object.assign(Object.assign({}, editFormData), { serviceAreas: newAreas }));
                }}>
                        Remove
                      </Button>
                    </div>))}
                  <Button type="button" onClick={() => setEditFormData(Object.assign(Object.assign({}, editFormData), { serviceAreas: [...(editFormData.serviceAreas || []), ''] }))} className="mt-2">
                    Add Service Area
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Save Changes</Button>
                  <Button type="button" variant="outline" onClick={() => {
                setEditingEmployee(null);
                setEditFormData({});
            }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>)}

        {/* Employee List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {loading ? (<div className="p-4 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>) : error ? (<div className="p-4 text-red-500">{error}</div>) : (<ul className="divide-y divide-gray-200">
              {filteredEmployees.map((employee) => {
                var _a;
                return (<li key={employee.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <UserIcon className="h-6 w-6 text-gray-400"/>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            {employee.name}
                          </h3>
                          <div className="mt-1 text-sm text-gray-500">
                            <p className="flex items-center">
                              <EnvelopeIcon className="h-4 w-4 mr-1"/>
                              {employee.email}
                            </p>
                            <p className="flex items-center">
                              <PhoneIcon className="h-4 w-4 mr-1"/>
                              {employee.phone}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(employee.status)}`}>
                        {employee.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {/* Performance Stats */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <StarIcon className="h-5 w-5 text-gray-400 mr-2"/>
                        <h4 className="font-medium">Performance</h4>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Rating: {((_a = employee.rating) === null || _a === void 0 ? void 0 : _a.toFixed(1)) || 'N/A'}/5</p>
                        <p>Completed Jobs: {employee.completedJobs}</p>
                      </div>
                    </div>

                    {/* Service Areas */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <MapPinIcon className="h-5 w-5 text-gray-400 mr-2"/>
                        <h4 className="font-medium">Service Areas</h4>
                      </div>
                      <div className="text-sm text-gray-600">
                        {employee.serviceAreas.map((zipCode, index) => (<span key={index} className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
                            {zipCode}
                          </span>))}
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Services */}
                  {employee.upcomingServices.length > 0 && (<div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Upcoming Services</h4>
                      <div className="space-y-2">
                        {employee.upcomingServices.map((service) => (<div key={service.id} className="flex items-center justify-between text-sm">
                            <span>{service.customerName}</span>
                            <span className="text-gray-500">
                              {new Date(service.scheduledDate).toLocaleDateString()}
                            </span>
                          </div>))}
                      </div>
                    </div>)}

                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <select value={employee.status} onChange={(e) => handleStatusChange(employee.id, e.target.value)} className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="ON_JOB">On Job</option>
                      </select>
                    </div>
                    <div className="flex space-x-4">
                      <Button onClick={() => {
                        setEditingEmployee(employee.id);
                        setEditFormData(employee);
                    }} variant="outline">
                        <PencilIcon className="h-4 w-4 mr-2"/>
                        Edit
                      </Button>
                      <Button onClick={() => handleDeleteEmployee(employee.id)} variant="destructive">
                        <TrashIcon className="h-4 w-4 mr-2"/>
                        Delete
                      </Button>
                    </div>
                  </div>
                </li>);
            })}
            </ul>)}
        </div>
      </div>
    </div>);
}
