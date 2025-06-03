'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BusinessPartnerManagement from '@/components/admin/BusinessPartnerManagement';
import ServiceAreaManagement from '@/components/admin/ServiceAreaManagement';
import { AdminDashboardLayout } from '@/components/layouts/AdminDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { UsersIcon, UserGroupIcon, CurrencyDollarIcon, ChartBarIcon, ClockIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import ScooperOnboardingTable from './ScooperOnboardingTable';
import CoverageTable from './CoverageTable';
import CoverageMap from './CoverageMap';
import CoveragePriorityTable from './CoveragePriorityTable';
import CoverageAnalytics from './CoverageAnalytics';
import NotificationsDropdown from '@/components/NotificationsDropdown';
import AdminRatings from '@/components/AdminRatings';

function NotifyAtRiskCustomersButton() {
  const [loading, setLoading] = useState(false);
  const handleNotify = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/notify-at-risk-customers', { method: 'POST' });
      const data = await res.json();
      if (data.notified > 0) {
        toast.success('Customers Notified', { description: `${data.notified} at-risk customers emailed.` });
      } else {
        toast('No at-risk customers to notify.');
      }
    } catch (e) {
      toast.error('Error notifying customers');
    }
    setLoading(false);
  };
  return (
    <div className="mb-4 flex justify-end">
      <Button onClick={handleNotify} disabled={loading} variant="secondary">
        {loading ? 'Notifying...' : 'Notify At-Risk Customers'}
      </Button>
    </div>
  );
}


function CoverageRiskCheckButton() {
  const [loading, setLoading] = useState(false);
  const handleCheck = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/monitor-coverage-risk', { method: 'POST' });
      const data = await res.json();
      if (data.atRiskZips && data.atRiskZips.length > 0) {
        toast.error('Coverage Risk!', { description: `At-risk zips: ${data.atRiskZips.join(', ')}` });
      } else {
        toast.success('All covered!', { description: 'No at-risk zips detected.' });
      }
    } catch (e) {
      toast.error('Error checking coverage risk');
    }
    setLoading(false);
  };
  return (
    <div className="mb-4 flex justify-end">
      <Button onClick={handleCheck} disabled={loading} variant="destructive">
        {loading ? 'Checking...' : 'Check Coverage Risk Now'}
      </Button>
    </div>
  );
}


export default function AdminDashboard() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to overview page to avoid conflicts with layout
        router.replace('/admin/dashboard/overview');
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
            </div>
        </div>
    );
}
