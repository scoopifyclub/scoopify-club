"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function CoveragePriorityTable() {
  const [customerZips, setCustomerZips] = useState([]);
  const [coveredZips, setCoveredZips] = useState([]);
  useEffect(() => {
    fetchCustomerZips();
    fetchCoveredZips();
  }, []);
  const fetchCustomerZips = async () => {
    try {
      const res = await fetch('/api/admin/active-customer-zips');
      if (!res.ok) throw new Error('Failed to fetch customer zips');
      const data = await res.json();
      setCustomerZips(data);
    } catch {}
  };
  const fetchCoveredZips = async () => {
    try {
      const res = await fetch('/api/coverage-area');
      if (!res.ok) throw new Error('Failed to fetch covered zips');
      const data = await res.json();
      setCoveredZips(Array.from(new Set(data.map(a => a.zipCode))));
    } catch {}
  };
  const [priorityZips, setPriorityZips] = useState([]);
  const [newZip, setNewZip] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPriorityZips();
  }, []);

  const fetchPriorityZips = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/coverage-priority');
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch priority zips');
      }
      const data = await response.json();
      setPriorityZips(data);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const addZip = async () => {
    if (!/^[0-9]{5}$/.test(newZip)) {
      toast.error('Enter a valid 5-digit zip code');
      return;
    }
    try {
      const res = await fetch('/api/admin/coverage-priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: newZip })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add zip');
      }
      toast.success('Priority zip added!', { description: `${newZip} added to recruiting list.` });
      setNewZip('');
      fetchPriorityZips();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const removeZip = async (zipCode) => {
    try {
      const res = await fetch('/api/admin/coverage-priority', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to remove zip');
      }
      toast.success('Priority zip removed!', { description: `${zipCode} removed from recruiting list.` });
      fetchPriorityZips();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (loading) return <Card className="p-4">Loading...</Card>;
  if (error) return <Card className="p-4 text-red-500">{error}</Card>;

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Priority Zip Codes for Recruiting</CardTitle>
          <Button asChild size="sm" variant="outline" title="Export priority zips">
            <a href="/api/admin/coverage-priority-export" download>
              Export CSV
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Add zip code..."
            value={newZip}
            onChange={e => setNewZip(e.target.value)}
            maxLength={5}
            className="w-32"
          />
          <Button onClick={addZip} size="sm">Add</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm md:text-base">
            <thead>
              <tr>
                <th className="px-4 py-2">Zip Code</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {priorityZips.map((row) => {
                const atRisk = customerZips.includes(row.zipCode) && !coveredZips.includes(row.zipCode);
                return (
                  <tr key={row.zipCode} className={atRisk ? 'bg-red-50' : ''}>
                    <td className={`px-4 py-2 font-mono font-semibold ${atRisk ? 'text-red-600' : ''}`}>{row.zipCode}{atRisk && <span className="ml-2 font-bold">⚠️</span>}</td>
                    <td className="px-4 py-2">
                      <Button size="sm" variant="outline" onClick={() => removeZip(row.zipCode)}>Remove</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
