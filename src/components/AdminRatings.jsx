import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ThumbsUp, ThumbsDown, Star } from 'lucide-react';

function exportCSV(sorted) {
  const rows = [
    ['Employee','Good','Bad','Percent Positive','Feedback','Date']
  ];
  sorted.forEach(({name, list, pct}) => {
    list.forEach(r => {
      rows.push([
        name,
        r.rating === 'good' ? 1 : 0,
        r.rating === 'bad' ? 1 : 0,
        pct + '%',
        r.feedback || '',
        new Date(r.createdAt).toLocaleDateString()
      ]);
    });
  });
  const csv = rows.map(row => row.map(x => '"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'employee_ratings.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminRatings() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRatings(); }, []);

  const fetchRatings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ratings');
      if (!res.ok) throw new Error('Failed to fetch ratings');
      const data = await res.json();
      setRatings(data);
    } catch (e) { setRatings([]); }
    setLoading(false);
  };

  const grouped = ratings.reduce((acc, r) => {
    if (!acc[r.employeeName]) acc[r.employeeName] = [];
    acc[r.employeeName].push(r);
    return acc;
  }, {});

  // Sort by worst performers (lowest % positive first)
  const sorted = Object.entries(grouped)
    .map(([name, list]) => {
      const total = list.length;
      const good = list.filter(r => r.rating === 'good').length;
      const bad = list.filter(r => r.rating === 'bad').length;
      const pct = total ? Math.round((good / total) * 100) : 0;
      return { name, list, good, bad, pct };
    })
    .sort((a, b) => a.pct - b.pct);

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Employee Ratings Overview</CardTitle>
        <button
          className="text-sm px-3 py-1 border rounded bg-blue-50 hover:bg-blue-100 text-blue-700"
          onClick={() => exportCSV(sorted)}
        >
          Export CSV
        </button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Loading...</div>
        ) : ratings.length === 0 ? (
          <div className="text-gray-500">No ratings yet</div>
        ) : (
          <div className="space-y-6">
            {sorted.map(({name, list, good, bad, pct}) => (
              <div key={name} className="border rounded p-3 bg-gray-50">
                <div className="flex items-center gap-4 mb-1">
                  <span className="font-semibold text-lg">{name}</span>
                  <ThumbsUp className="text-green-500" /> {good}
                  <ThumbsDown className="text-red-500" /> {bad}
                  <Star className="text-yellow-500" /> {pct}% Positive
                </div>
                <div className="space-y-1 ml-2">
                  {list.map((r,i) => (
                    <div key={i} className={`text-sm ${r.rating === 'bad' ? 'text-red-700' : ''}`}>
                      {r.rating === 'bad' && r.feedback && (
                        <span className="font-bold">Negative: "{r.feedback}"</span>
                      )}
                      {r.rating === 'good' && 'Positive'}
                      <span className="text-xs text-gray-400 ml-2">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
