import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ServiceAreaManagement() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', zipCodes: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchAreas(); }, []);

  const fetchAreas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/service-areas');
      const data = await res.json();
      setAreas(data.areas);
    } catch {}
    setLoading(false);
  };

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleCreate = async e => {
    e.preventDefault();
    setCreating(true);
    try {
      await fetch('/api/admin/service-areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          zipCodes: form.zipCodes.split(',').map(z => z.trim()).filter(Boolean)
        })
      });
      setForm({ name: '', zipCodes: '' });
      fetchAreas();
    } finally { setCreating(false); }
  };

  return (
    <Card className="my-8">
      <CardHeader>
        <CardTitle>Service Areas</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreate} className="flex space-x-2 mb-4">
          <Input name="name" placeholder="Area Name" value={form.name} onChange={handleChange} required />
          <Input name="zipCodes" placeholder="Zip Codes (comma separated)" value={form.zipCodes} onChange={handleChange} required />
          <Button type="submit" disabled={creating}>{creating ? 'Adding...' : 'Add Area'}</Button>
        </form>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Zip Codes</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {areas.map(area => (
              <TableRow key={area.id}>
                <TableCell>{area.name}</TableCell>
                <TableCell>{area.zipCodes.join(', ')}</TableCell>
                <TableCell>{area.active ? 'Active' : 'Inactive'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
