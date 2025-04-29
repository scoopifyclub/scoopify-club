'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserGroupIcon, CurrencyDollarIcon, CheckCircleIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '@/lib/utils';
import PaymentModal from '@/components/PaymentModal';
import PaymentHistoryModal from '@/components/PaymentHistoryModal';
export default function AdminReferralsPage() {
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [processingPayment, setProcessingPayment] = useState(null);
    const [selectedReferral, setSelectedReferral] = useState(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const router = useRouter();
    useEffect(() => {
        fetchReferrals();
    }, []);
    const fetchReferrals = async () => {
        try {
            const response = await fetch('/api/admin/referrals', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok)
                throw new Error('Failed to fetch referrals');
            const data = await response.json();
            setReferrals(data.referrals);
            setError(null);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load referrals');
        }
        finally {
            setLoading(false);
        }
    };
    const handleUpdateStatus = async (referralId, newStatus) => {
        try {
            const response = await fetch(`/api/admin/referrals/${referralId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (!response.ok)
                throw new Error('Failed to update referral status');
            fetchReferrals(); // Refresh the list
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update referral status');
        }
    };
    const handleProcessPayment = async (amount, cashAppPaymentId) => {
        try {
            if (!selectedReferral)
                return;
            const response = await fetch('/api/admin/referrals/payment', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    referralId: selectedReferral.id,
                    amount,
                    cashAppPaymentId
                })
            });
            if (!response.ok) {
                throw new Error('Failed to process payment');
            }
            await fetchReferrals(); // Refresh the list
            setIsPaymentModalOpen(false);
            setSelectedReferral(null);
        }
        catch (err) {
            throw err;
        }
    };
    const filteredReferrals = referrals.filter(referral => {
        const matchesStatus = statusFilter === 'all' || referral.status === statusFilter;
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = referral.referrer.name.toLowerCase().includes(searchLower) ||
            referral.referrer.email.toLowerCase().includes(searchLower) ||
            referral.referred.name.toLowerCase().includes(searchLower) ||
            referral.referred.email.toLowerCase().includes(searchLower);
        return matchesStatus && matchesSearch;
    });
    const stats = {
        total: referrals.length,
        active: referrals.filter(r => r.status === 'ACTIVE').length,
        pending: referrals.filter(r => r.status === 'PENDING').length,
        totalPaid: referrals.reduce((sum, r) => sum + r.payments.reduce((pSum, p) => pSum + (p.status === 'SUCCESS' ? p.amount : 0), 0), 0)
    };
    return (<div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Referral Management</h1>
          <p className="mt-2 text-gray-600">Manage and track customer referrals</p>
        </div>

        {error && (<div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>)}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-6 w-6 text-gray-400"/>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Referrals</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-gray-400"/>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Referrals</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{stats.active}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-gray-400"/>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Referrals</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{stats.pending}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-gray-400"/>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Paid</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalPaid)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input type="text" placeholder="Search referrals..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"/>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStatusFilter('all')} className={`px-4 py-2 rounded-lg ${statusFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
              All
            </button>
            <button onClick={() => setStatusFilter('ACTIVE')} className={`px-4 py-2 rounded-lg ${statusFilter === 'ACTIVE' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
              Active
            </button>
            <button onClick={() => setStatusFilter('PENDING')} className={`px-4 py-2 rounded-lg ${statusFilter === 'PENDING' ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
              Pending
            </button>
          </div>
        </div>

        {/* Referrals List */}
        <div className="bg-white shadow rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referrer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referred Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (<tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    </td>
                  </tr>) : filteredReferrals.length === 0 ? (<tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No referrals found
                    </td>
                  </tr>) : (filteredReferrals.map((referral) => (<tr key={referral.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {referral.referrer.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {referral.referrer.email}
                          </div>
                          {referral.referrer.cashAppTag && (<div className="text-sm text-gray-500">
                              Cash App: ${referral.referrer.cashAppTag}
                            </div>)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {referral.referred.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {referral.referred.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            Plan: {referral.referred.subscription.plan.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${referral.status === 'ACTIVE'
                ? 'bg-green-100 text-green-800'
                : referral.status === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'}`}>
                          {referral.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(new Date(referral.createdAt))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {referral.payments.length > 0 ? (<div>
                            <div className="text-sm text-gray-900">
                              {formatCurrency(referral.payments[0].amount)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatDate(new Date(referral.payments[0].paymentDate))}
                            </div>
                          </div>) : (<span className="text-sm text-gray-500">No payments</span>)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          {referral.status === 'PENDING' && (<button onClick={() => handleUpdateStatus(referral.id, 'ACTIVE')} className="text-green-600 hover:text-green-900">
                              Activate
                            </button>)}
                          {referral.status === 'ACTIVE' && (<>
                              <button onClick={() => {
                    setSelectedReferral(referral);
                    setIsPaymentModalOpen(true);
                }} disabled={processingPayment === referral.id} className="text-blue-600 hover:text-blue-900 disabled:text-gray-400">
                                {processingPayment === referral.id ? (<ArrowPathIcon className="h-5 w-5 animate-spin"/>) : ('Process Payment')}
                              </button>
                              <button onClick={() => {
                    setSelectedReferral(referral);
                    setIsHistoryModalOpen(true);
                }} className="text-gray-600 hover:text-gray-900">
                                View History
                              </button>
                              <button onClick={() => handleUpdateStatus(referral.id, 'CANCELLED')} className="text-red-600 hover:text-red-900">
                                Cancel
                              </button>
                            </>)}
                        </div>
                      </td>
                    </tr>)))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add both modal components */}
      {selectedReferral && (<>
          <PaymentModal isOpen={isPaymentModalOpen} onClose={() => {
                setIsPaymentModalOpen(false);
                setSelectedReferral(null);
            }} onSubmit={handleProcessPayment} referral={selectedReferral}/>
          <PaymentHistoryModal isOpen={isHistoryModalOpen} onClose={() => {
                setIsHistoryModalOpen(false);
                setSelectedReferral(null);
            }} referral={selectedReferral}/>
        </>)}
    </div>);
}
