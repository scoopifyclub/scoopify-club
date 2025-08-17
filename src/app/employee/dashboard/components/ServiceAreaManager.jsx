'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';





/**
 * ServiceAreaManager
 * @param {string} employeeId - The employee's ID.
 * @param {function} [onOnboardingComplete] - Optional callback, called when onboarding is completed (first service area added).
 */
export function ServiceAreaManager({ employeeId, onOnboardingComplete }) {
  const [serviceAreas, setServiceAreas] = useState([]);
  const [newArea, setNewArea] = useState({
    zipCode: '',
    travelRange: 10,
    active: true
  });
  const [loading, setLoading] = useState(true);
  const [showRecalc, setShowRecalc] = useState(false);
  const [recalcZip, setRecalcZip] = useState('');
  const [recalcRange, setRecalcRange] = useState(10);
  const [recalcLoading, setRecalcLoading] = useState(false);
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
      // Don't show toast error, just log it
      setLoading(false);
      // Set empty service areas instead of breaking
      setServiceAreas([]);
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
      // Refetch to get the latest areas
      fetchServiceAreas();
      // If this was the first area, trigger onboarding complete callback
      if (typeof onOnboardingComplete === 'function') {
        // Fetch again to get updated list (or you could pass serviceAreas.length === 0 before add)
        const updatedAreas = await fetch('/api/employee/service-area', { credentials: 'include' })
          .then(r => r.ok ? r.json() : []);
        if (updatedAreas.length === 1) { // first ever
          onOnboardingComplete();
        }
      }
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
      <Card>
        <div className="space-y-4 p-6">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>
      </Card>
    );
  }

  // Show message when no service areas or when API fails
  if (serviceAreas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Manage Service Areas</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <p>No service areas configured yet</p>
            <p className="text-sm mb-4">Add your first service area to get started</p>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter ZIP code"
                  value={newArea.zipCode}
                  onChange={(e) => setNewArea({ ...newArea, zipCode: e.target.value })}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Travel range (miles)"
                  value={newArea.travelRange}
                  onChange={(e) => setNewArea({ ...newArea, travelRange: parseInt(e.target.value) || 10 })}
                  className="w-32"
                />
                <Button onClick={handleAddArea}>Add Area</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setShowRecalc(true)}>Recalculate Area</Button>
      </div>
      <Dialog open={showRecalc} onOpenChange={setShowRecalc}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recalculate Service Area</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="text"
              value={recalcZip}
              onChange={e => setRecalcZip(e.target.value)}
              placeholder="Enter home zip code"
              maxLength={5}
            />
            <select
              value={recalcRange}
              onChange={e => setRecalcRange(Number(e.target.value))}
              className="block w-full rounded-md border border-gray-300 p-2"
            >
              {[5, 10, 15, 20, 25, 30].map(miles => (
                <option key={miles} value={miles}>{miles} miles</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button
              onClick={async () => {
                setRecalcLoading(true);
                try {
                  const res = await fetch('/api/employee/service-area/recalculate', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ homeZip: recalcZip, travelRange: recalcRange })
                  });
                  if (!res.ok) throw new Error('Failed to recalculate');
                  setShowRecalc(false);
                  fetchServiceAreas();
                  toast.success('Service area updated!');
                } catch {
                  toast.error('Failed to recalculate area');
                } finally {
                  setRecalcLoading(false);
                }
              }}
              disabled={recalcLoading || !/^[0-9]{5}$/.test(recalcZip)}
            >
              {recalcLoading ? 'Updating...' : 'Recalculate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
                  <p className="text-sm text-gray-500">{area.travelDistance} mile radius</p>
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
