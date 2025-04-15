'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { MapPin, Plus, Trash2, RefreshCw } from 'lucide-react';

interface ServiceArea {
  id: string;
  zipCode: string;
  radius: number;
  isPrimary: boolean;
}

interface Employee {
  id: string;
  name: string;
  isActive: boolean;
  serviceAreas: ServiceArea[];
}

export default function ServiceAreaManager() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/admin/employees');
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddServiceArea = async (employeeId: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/employees/${employeeId}/service-areas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipCode: '',
          radius: 10,
          isPrimary: false,
        }),
      });

      if (response.ok) {
        const newArea = await response.json();
        setEmployees(employees.map(emp => 
          emp.id === employeeId 
            ? { ...emp, serviceAreas: [...emp.serviceAreas, newArea] }
            : emp
        ));
      }
    } catch (error) {
      console.error('Error adding service area:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateServiceArea = async (
    employeeId: string,
    areaId: string,
    updates: Partial<ServiceArea>
  ) => {
    setUpdating(true);
    try {
      const response = await fetch(
        `/api/admin/employees/${employeeId}/service-areas/${areaId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        }
      );

      if (response.ok) {
        const updatedArea = await response.json();
        setEmployees(employees.map(emp => 
          emp.id === employeeId
            ? {
                ...emp,
                serviceAreas: emp.serviceAreas.map(area =>
                  area.id === areaId ? updatedArea : area
                ),
              }
            : emp
        ));
      }
    } catch (error) {
      console.error('Error updating service area:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteServiceArea = async (employeeId: string, areaId: string) => {
    setUpdating(true);
    try {
      const response = await fetch(
        `/api/admin/employees/${employeeId}/service-areas/${areaId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setEmployees(employees.map(emp => 
          emp.id === employeeId
            ? {
                ...emp,
                serviceAreas: emp.serviceAreas.filter(area => area.id !== areaId),
              }
            : emp
        ));
      }
    } catch (error) {
      console.error('Error deleting service area:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleEmployee = async (employeeId: string, isActive: boolean) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/employees/${employeeId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        setEmployees(employees.map(emp => 
          emp.id === employeeId ? { ...emp, isActive } : emp
        ));
      }
    } catch (error) {
      console.error('Error updating employee status:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Service Area Management</h2>
        <Button
          onClick={fetchEmployees}
          disabled={updating}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6">
        {employees.map((employee) => (
          <div
            key={employee.id}
            className="bg-white rounded-lg shadow p-6 space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-medium">{employee.name}</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {employee.isActive ? 'Active' : 'Inactive'}
                </span>
                <Switch
                  checked={employee.isActive}
                  onCheckedChange={(checked) =>
                    handleToggleEmployee(employee.id, checked)
                  }
                />
              </div>
            </div>

            <div className="space-y-4">
              {employee.serviceAreas.map((area) => (
                <div
                  key={area.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Zip Code
                      </label>
                      <Input
                        type="text"
                        value={area.zipCode}
                        onChange={(e) =>
                          handleUpdateServiceArea(employee.id, area.id, {
                            zipCode: e.target.value,
                          })
                        }
                        placeholder="Enter zip code"
                        className="max-w-[120px]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Radius (miles)
                      </label>
                      <Input
                        type="number"
                        value={area.radius}
                        onChange={(e) =>
                          handleUpdateServiceArea(employee.id, area.id, {
                            radius: parseInt(e.target.value) || 0,
                          })
                        }
                        min="0"
                        max="100"
                        className="max-w-[120px]"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={area.isPrimary}
                        onCheckedChange={(checked) =>
                          handleUpdateServiceArea(employee.id, area.id, {
                            isPrimary: checked,
                          })
                        }
                      />
                      <span className="text-sm text-gray-500">Primary Area</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteServiceArea(employee.id, area.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                onClick={() => handleAddServiceArea(employee.id)}
                variant="outline"
                className="w-full"
                disabled={updating}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Service Area
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 