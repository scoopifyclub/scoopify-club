import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function CoverageTable() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCoverage();
  }, []);

  const fetchCoverage = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/coverage-area');
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch coverage areas');
      }
      const data = await response.json();
      setAreas(data);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  if (loading) return (
    <Card className="p-4">
      <div className="animate-pulse space-y-2">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-2" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-4 bg-gray-100 rounded w-full" />
        ))}
      </div>
    </Card>
  );
  if (error) return <Card className="p-4 text-red-500">{error}</Card>;

  // Deduplicate zip codes and count scoopers per zip
  const zipMap = {};
  for (const area of areas) {
    if (!zipMap[area.zipCode]) zipMap[area.zipCode] = [];
    zipMap[area.zipCode].push(area.employeeId);
  }

  const zipRows = Object.entries(zipMap).map(([zip, employees]) => ({
    zipCode: zip,
    scooperCount: employees.length,
    employeeIds: employees
  }));

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Service Area Coverage by Zip Code</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm md:text-base">
            <thead>
              <tr>
                <th className="px-4 py-2">Zip Code</th>
                <th className="px-4 py-2">Active Scoopers</th>
              </tr>
            </thead>
            <tbody>
              {zipRows.map((row) => (
                <tr key={row.zipCode}>
                  <td className="px-4 py-2 font-mono font-semibold">{row.zipCode}</td>
                  <td className="px-4 py-2">{row.scooperCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
