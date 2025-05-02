import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ScooperOnboardingTable() {
  const [scoopers, setScoopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reminding, setReminding] = useState({}); // { [employeeId]: true }

  useEffect(() => {
    fetchOnboarding();
  }, []);

  const fetchOnboarding = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/employees/onboarding', { credentials: 'include' });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch onboarding status');
      }
      const data = await response.json();
      setScoopers(data);
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

  const [remindAllLoading, setRemindAllLoading] = useState(false);

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Scooper Onboarding Status</CardTitle>
          <Button
            size="sm"
            variant="default"
            aria-label="Remind all incomplete scoopers"
            disabled={remindAllLoading}
            onClick={async () => {
              setRemindAllLoading(true);
              try {
                const res = await fetch('/api/admin/employees/remind-onboarding', {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ employeeId: 'ALL' })
                });
                const data = await res.json();
                if (!res.ok || !data.success) {
                  throw new Error(data.error || data.message || 'Failed to send reminders');
                }
                toast.success(`Reminders sent to ${data.count || 0} scoopers!`, { description: 'All incomplete scoopers have received a notification.' });
              } catch (e) {
                toast.error('Failed to send reminders', { description: e.message });
              }
              setRemindAllLoading(false);
            }}
          >
            {remindAllLoading ? 'Sending...' : 'Remind All'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm md:text-base">
            <thead>
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Onboarding Complete</th>
                <th className="px-4 py-2">Service Areas</th>
                <th className="px-4 py-2">Joined</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {scoopers.map((scooper) => (
                <tr key={scooper.id} className={!scooper.hasSetServiceArea || scooper.serviceAreaCount === 0 ? 'bg-yellow-50' : ''}>
                  <td className="px-4 py-2 font-medium">{scooper.name || '—'}</td>
                  <td className="px-4 py-2">{scooper.email}</td>
                  <td className="px-4 py-2">
                    {scooper.hasSetServiceArea && scooper.serviceAreaCount > 0 ? (
                      <span className="text-green-600 font-semibold">Yes</span>
                    ) : (
                      <span className="text-yellow-600 font-semibold">No</span>
                    )}
                  </td>
                  <td className="px-4 py-2">{scooper.serviceAreaCount}</td>
                  <td className="px-4 py-2">{new Date(scooper.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-2">
                    {!scooper.hasSetServiceArea || scooper.serviceAreaCount === 0 ? (
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label={`Remind ${scooper.name || scooper.email}`}
                        disabled={reminding[scooper.id] || remindAllLoading}
                        onClick={async () => {
                          setReminding(r => ({ ...r, [scooper.id]: true }));
                          try {
                            const res = await fetch('/api/admin/employees/remind-onboarding', {
                              method: 'POST',
                              credentials: 'include',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ employeeId: scooper.id })
                            });
                            if (!res.ok) {
                              const err = await res.json();
                              throw new Error(err.error || 'Failed to send reminder');
                            }
                            toast.success('Reminder sent!', { description: `${scooper.name || scooper.email} has been notified.` });
                          } catch (e) {
                            toast.error('Failed to send reminder', { description: e.message });
                          }
                          setReminding(r => ({ ...r, [scooper.id]: false }));
                        }}
                      >
                        {reminding[scooper.id] ? 'Sending...' : 'Remind'}
                      </Button>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
