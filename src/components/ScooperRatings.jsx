import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function ScooperRatings({ employeeId }) {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRatings();
  }, [employeeId]);

  const fetchRatings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/employee/ratings?employeeId=${employeeId}`);
      if (!res.ok) throw new Error('Failed to fetch ratings');
      const data = await res.json();
      setRatings(data);
    } catch (err) {
      setRatings([]);
    } finally {
      setLoading(false);
    }
  };

  const goodCount = ratings.filter(r => r.rating === 'good').length;
  const badCount = ratings.filter(r => r.rating === 'bad').length;
  const total = ratings.length;
  const goodPct = total ? Math.round((goodCount / total) * 100) : 0;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>My Ratings</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Loading...</div>
        ) : total === 0 ? (
          <div className="text-gray-500">No ratings yet</div>
        ) : (
          <>
            <div className="flex items-center gap-6 mb-4">
              <div className="flex items-center gap-2">
                <ThumbsUp className="text-green-500" />
                <span>{goodCount} Good</span>
              </div>
              <div className="flex items-center gap-2">
                <ThumbsDown className="text-red-500" />
                <span>{badCount} Bad</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="text-yellow-500" />
                <span>{goodPct}% Positive</span>
              </div>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {ratings.map((r, i) => (
                <div key={i} className={`p-3 rounded border ${r.rating === 'good' ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center gap-2">
                    {r.rating === 'good' ? <ThumbsUp className="text-green-500" /> : <ThumbsDown className="text-red-500" />}
                    <span className="font-semibold">{r.rating === 'good' ? 'Good' : 'Bad'} Service</span>
                    <span className="text-xs text-gray-400 ml-2">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.feedback && (
                    <div className="text-sm text-gray-700 mt-1">"{r.feedback}"</div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
