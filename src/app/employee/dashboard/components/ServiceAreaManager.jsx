'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';





export function ServiceAreaManager({ employeeId }) {
  const [serviceAreas, setServiceAreas] = useState([]);
  const [newArea, setNewArea] = useState({
    zipCode: '',
    travelRange: 10,
    active: true
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchServiceAreas();
  }, []);

  const fetchServiceAreas = async () => {
    try {
      const response = await fetch('/api/employee/service-area', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch service areas');
      }
      const data = await response.json();
      setServiceAreas(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching service areas:', error);
      toast.error('Failed to load service areas');
      setLoading(false);
    }
  };

  const handleAddArea = async () => {
    if (!newArea.zipCode) {
      toast.error('Please enter a zip code');
      return;
    }

    try {
      const response = await fetch('/api/employee/service-area', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newArea)
      });

      if (!response.ok) {
        throw new Error('Failed to add service area');
      }

      toast.success('Service area added successfully');
      setNewArea({ zipCode: '', travelRange: 10, active: true });
      fetchServiceAreas();
    } catch (error) {
      console.error('Error adding service area:', error);
      toast.error('Failed to add service area');
    }
  };

  const handleToggleArea = async (area) => {
    try {
      const response = await fetch('/api/employee/service-area', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: area.id,
          active: !area.active
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update service area');
      }

      toast.success('Service area updated successfully');
      fetchServiceAreas();
    } catch (error) {
      console.error('Error updating service area:', error);
      toast.error('Failed to update service area');
    }
  };

  const handleDeleteArea = async (area) => {
    if (!confirm('Are you sure you want to delete this service area?')) {
      return;
    }

    try {
      const response = await fetch('/api/employee/service-area', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: area.id })
      });

      if (!response.ok) {
        throw new Error('Failed to delete service area');
      }

      toast.success('Service area deleted successfully');
      fetchServiceAreas();
    } catch (error) {
      console.error('Error deleting service area:', error);
      toast.error('Failed to delete service area');
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Service Area</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Zip Code</label>
              <Input
                type="text"
                value={newArea.zipCode}
                onChange={(e) => setNewArea({ ...newArea, zipCode: e.target.value })}
                placeholder="Enter zip code"
                className="mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Travel Range (miles)</label>
              <Select
                value={newArea.travelRange.toString()}
                onValueChange={(value) => setNewArea({ ...newArea, travelRange: parseInt(value) })}
                className="mt-1"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select travel range" />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 20, 25, 30].map(range => (
                    <SelectItem key={range} value={range.toString()}>
                      {range} miles
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleAddArea}>
            Add Service Area
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Service Areas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {serviceAreas.map((area) => (
              <div key={area.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{area.zipCode}</p>
                  <p className="text-sm text-gray-500">{area.travelRange} mile radius</p>
                </div>
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => handleToggleArea(area)}
                  >
                    {area.active ? 'Active' : 'Inactive'}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteArea(area)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
            {serviceAreas.length === 0 && (
              <p className="text-gray-500 text-center py-4">No service areas added yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
