'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserPlusIcon,
  CurrencyDollarIcon,
  ClipboardIcon,
  CheckIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ReferralStats {
  referralCode: string;
  cashAppTag: string | null;
  stats: {
    activeReferrals: number;
    pendingReferrals: number;
    totalEarned: number;
  };
  referrals: Array<{
    id: string;
    status: string;
    customerName: string;
    createdAt: string;
    paidAt: string | null;
  }>;
}

export default function ReferralsPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cashAppTag, setCashAppTag] = useState('');
  const [copied, setCopied] = useState(false);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchReferralStats();
  }, []);

  const fetchReferralStats = async () => {
    try {
      const response = await fetch('/api/referrals', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch referral stats');
      
      const data = await response.json();
      setStats(data);
      setCashAppTag(data.cashAppTag || '');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load referral stats');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReferralCode = () => {
    if (stats?.referralCode) {
      navigator.clipboard.writeText(stats.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUpdateCashApp = async () => {
    if (!cashAppTag) return;

    setUpdating(true);
    try {
      const response = await fetch('/api/referrals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cashAppTag })
      });

      if (!response.ok) throw new Error('Failed to update Cash App tag');

      fetchReferralStats(); // Refresh stats
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update Cash App tag');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Referral Program</h1>
          <p className="mt-2 text-gray-600">
            Earn $5 per month for each friend you refer who becomes an active subscriber
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Referral Code Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Your Referral Code</h2>
          <div className="flex items-center space-x-4">
            <div className="flex-1 bg-gray-50 rounded-lg p-4">
              <p className="text-2xl font-mono font-bold text-gray-700">
                {stats?.referralCode}
              </p>
            </div>
            <button
              onClick={handleCopyReferralCode}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              {copied ? (
                <CheckIcon className="h-5 w-5 mr-2 text-green-500" />
              ) : (
                <ClipboardIcon className="h-5 w-5 mr-2" />
              )}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
        </div>

        {/* Cash App Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cash App Tag
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                  $
                </span>
                <input
                  type="text"
                  value={cashAppTag}
                  onChange={(e) => setCashAppTag(e.target.value)}
                  placeholder="YourCashAppTag"
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <button
              onClick={handleUpdateCashApp}
              disabled={updating || !cashAppTag}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {updating ? 'Updating...' : 'Update Cash App Tag'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Referrals
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stats?.stats.activeReferrals}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserPlusIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Referrals
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stats?.stats.pendingReferrals}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Earned
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(stats?.stats.totalEarned || 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Referrals List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Your Referrals</h2>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {stats?.referrals.length === 0 ? (
                <li className="px-4 py-5 sm:px-6 text-center text-gray-500">
                  No referrals yet. Share your code to start earning!
                </li>
              ) : (
                stats?.referrals.map((referral) => (
                  <li key={referral.id} className="px-4 py-5 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {referral.customerName}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Joined {formatDate(new Date(referral.createdAt))}
                        </p>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          referral.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {referral.status}
                        </span>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 