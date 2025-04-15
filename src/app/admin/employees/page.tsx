'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, DollarSign } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  cashAppTag: string;
  services: {
    id: string;
    date: string;
    price: number;
    status: string;
  }[];
}

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete employee');

      setEmployees(employees.filter(emp => emp.id !== employeeId));
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  const calculateEarnings = (services: Employee['services']) => {
    return services
      .filter(service => service.status === 'COMPLETED')
      .reduce((total, service) => total + service.price, 0);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-2xl font-semibold">Loading...</div>
          <div className="text-gray-600">Please wait while we load employee data</div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Employee Management</h1>
          <Button onClick={() => window.location.href = '/employee/register'}>
            Add New Employee
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {employees.map((employee) => (
            <div
              key={employee.id}
              className="rounded-lg bg-white p-6 shadow"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{employee.name}</h3>
                  <p className="text-gray-600">{employee.email}</p>
                  <p className="text-gray-600">{employee.phone}</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.location.href = `/admin/employees/${employee.id}/edit`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-red-600"
                    onClick={() => handleDelete(employee.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium">Address</h4>
                <p className="text-gray-600">
                  {employee.address.street}
                  <br />
                  {employee.address.city}, {employee.address.state} {employee.address.zipCode}
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-medium">Cash App Tag</h4>
                <p className="text-gray-600">{employee.cashAppTag}</p>
              </div>

              <div>
                <h4 className="font-medium">Earnings</h4>
                <div className="flex items-center text-gray-600">
                  <DollarSign className="mr-1 h-4 w-4" />
                  {calculateEarnings(employee.services).toFixed(2)}
                </div>
                <p className="text-sm text-gray-500">
                  {employee.services.filter(s => s.status === 'COMPLETED').length} completed services
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
} 