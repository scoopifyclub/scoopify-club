import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader } from 'lucide-react';

export default function CoverageAnalytics() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/admin/analytics/coverage-history')
      .then(r => r.json())
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Coverage Trends (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader className="animate-spin h-8 w-8 text-gray-400" />
          </div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm md:text-base">
              <thead>
                <tr>
                  <th className="px-2 py-1">Date</th>
                  <th className="px-2 py-1">Covered Zips</th>
                  <th className="px-2 py-1">At-Risk Zips</th>
                  <th className="px-2 py-1">Priority Zips</th>
                </tr>
              </thead>
              <tbody>
                {data.map(row => (
                  <tr key={row.date}>
                    <td className="px-2 py-1 font-mono">{row.date}</td>
                    <td className="px-2 py-1 text-green-700 font-bold">{row.covered}</td>
                    <td className={`px-2 py-1 font-bold ${row.atRisk > 0 ? 'text-red-600' : 'text-gray-500'}`}>{row.atRisk}</td>
                    <td className="px-2 py-1 text-orange-500 font-bold">{row.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
