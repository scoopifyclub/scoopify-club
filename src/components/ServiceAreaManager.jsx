'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { MapPin, Plus, Trash2, RefreshCw } from 'lucide-react';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

/**
 * @typedef {Object} ServiceArea
 * @property {string} id - Unique identifier for the service area
 * @property {string} zipCode - ZIP code for the service area
 * @property {number} radius - Radius of the service area in miles
 * @property {boolean} isPrimary - Whether this is the primary service area
 * @property {number} latitude - Latitude coordinate of the service area
 * @property {number} longitude - Longitude coordinate of the service area
 */

/**
 * @typedef {Object} Employee
 * @property {string} id - Unique identifier for the employee
 * @property {string} name - Employee's name
 * @property {boolean} isActive - Whether the employee is active
 * @property {ServiceArea[]} serviceAreas - List of service areas assigned to the employee
 */

/**
 * ServiceAreaManager component for managing employee service areas
 * @returns {JSX.Element} The rendered component
 */
export default function ServiceAreaManager() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [selectedArea, setSelectedArea] = useState(null);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await fetch('/api/admin/employees');
            const data = await response.json();
            setEmployees(data);
        }
        catch (error) {
            console.error('Error fetching employees:', error);
        }
        finally {
            setLoading(false);
        }
    };

    /**
     * Adds a new service area for an employee
     * @param {string} employeeId - ID of the employee
     */
    const handleAddServiceArea = async (employeeId) => {
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
        }
        catch (error) {
            console.error('Error adding service area:', error);
        }
        finally {
            setUpdating(false);
        }
    };

    /**
     * Updates an existing service area
     * @param {string} employeeId - ID of the employee
     * @param {string} areaId - ID of the service area
     * @param {Partial<ServiceArea>} updates - Partial updates to apply to the service area
     */
    const handleUpdateServiceArea = async (employeeId, areaId, updates) => {
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
        }
        catch (error) {
            console.error('Error updating service area:', error);
        }
        finally {
            setUpdating(false);
        }
    };

    /**
     * Deletes a service area
     * @param {string} employeeId - ID of the employee
     * @param {string} areaId - ID of the service area to delete
     */
    const handleDeleteServiceArea = async (employeeId, areaId) => {
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
        }
        catch (error) {
            console.error('Error deleting service area:', error);
        }
        finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Service Area Management</h2>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    {employees.map((employee) => (
                        <Card key={employee.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5" />
                                        {employee.name}
                                    </span>
                                    <Button
                                        onClick={() => handleAddServiceArea(employee.id)}
                                        variant="outline"
                                        size="sm"
                                        disabled={updating}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Area
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
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
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="h-[600px] rounded-lg overflow-hidden">
                    <Map center={selectedArea ? [selectedArea.latitude, selectedArea.longitude] : [37.7749, -122.4194]} zoom={12} markers={employees.flatMap(emp => emp.serviceAreas.map(area => ({
                        position: [area.latitude, area.longitude],
                        title: emp.name,
                        description: `Radius: ${area.radius} miles`,
                        radius: area.radius * 1609.34 // Convert miles to meters
                    })))}/>
                </div>
            </div>
        </div>
    );
}
