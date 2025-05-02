import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

export default function ServiceAreaSelect({ value, onChange, required }) {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/service-areas')
      .then(res => res.json())
      .then(data => setAreas(data.areas || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading service areas...</div>;

  return (
    <div>
      <label htmlFor="serviceArea" className="block text-sm font-medium text-gray-700">Service Area</label>
      <select
        id="serviceArea"
        name="serviceArea"
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
      >
        <option value="">Select a service area</option>
        {areas.map(area => (
          <option key={area.id} value={area.id}>{area.name} ({area.zipCodes.join(', ')})</option>
        ))}
      </select>
    </div>
  );
}
