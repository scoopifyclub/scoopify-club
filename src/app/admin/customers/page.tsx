'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserIcon, 
  MapPinIcon, 
  CreditCardIcon,
  CalendarIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface Customer {
  id: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    role: string;
  } | null;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  } | null;
  phone: string | null;
  stripeCustomerId: string | null;
  cashappName: string | null;
  serviceDay: string | null;
  subscription: {
    id: string;
    status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'INACTIVE';
    startDate: string;
    endDate: string | null;
    plan: {
      id: string;
      name: string;
      price: number;
      type: string;
      duration: string;
    } | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/customers', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Invalid response from server');
      }
      
      if (!response.ok) {
        const errorMessage = data?.error || 'Failed to fetch customers';
        console.error('Failed to fetch customers:', { status: response.status, data });
        throw new Error(errorMessage);
      }
      
      console.log('Raw API response:', data);
      
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format');
      }
      
      if (!Array.isArray(data.customers)) {
        console.error('Invalid customers data format:', data);
        throw new Error('Invalid data format received from server');
      }

      setCustomers(data.customers);
      setError(null);
    } catch (err) {
      console.error('Error in fetchCustomers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCustomer = async (customerId: string, updates: Partial<Customer>) => {
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update customer');
      }

      fetchCustomers(); // Refresh the list
      setEditingCustomer(null);
    } catch (err) {
      console.error('Error updating customer:', err);
      setError(err instanceof Error ? err.message : 'Failed to update customer');
    }
  };

  const handleCancelSubscription = async (customerId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;

    try {
      const response = await fetch(`/api/admin/customers/${customerId}/subscription`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      fetchCustomers(); // Refresh the list
    } catch (err) {
      console.error('Error canceling subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'PAST_DUE':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (customer.user?.name || '').toLowerCase().includes(searchLower) ||
      (customer.user?.email || '').toLowerCase().includes(searchLower) ||
      (customer.address?.street || '').toLowerCase().includes(searchLower)
    );
  });

  const renderCustomerAddress = (customer: Customer) => {
    if (!customer.address) {
      return <p className="text-sm text-gray-500">No address provided</p>;
    }

    return (
      <p className="text-sm text-gray-600">
        {customer.address.street}<br />
        {customer.address.city}, {customer.address.state} {customer.address.zipCode}
        {customer.address.country && <><br />{customer.address.country}</>}
      </p>
    );
  };

  const renderSubscriptionInfo = (customer: Customer) => {
    if (!customer.subscription || !customer.subscription.plan) {
      return <p className="text-sm text-gray-500">No active subscription</p>;
    }

    return (
      <div className="text-sm text-gray-600">
        <p>Plan: {customer.subscription.plan.name}</p>
        <p>Price: ${customer.subscription.plan.price}/month</p>
        <p>Status: {customer.subscription.status}</p>
        <p>Start Date: {new Date(customer.subscription.startDate).toLocaleDateString()}</p>
        {customer.subscription.endDate && (
          <p>End Date: {new Date(customer.subscription.endDate).toLocaleDateString()}</p>
        )}
        <p>Service Day: {customer.serviceDay || 'Not set'}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
          <p className="mt-2 text-gray-600">Manage customer details, subscriptions, and billing</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Customer List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {loading ? (
            <div className="p-4 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <div className="text-red-500 mb-4">{error}</div>
              <button
                onClick={() => fetchCustomers()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Try Again
              </button>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchTerm ? 'No customers found matching your search' : 'No customers found'}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <li key={customer.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <UserIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            {customer.user?.name || 'Unknown'}
                          </h3>
                          <div className="mt-1 text-sm text-gray-500">
                            <p>{customer.user?.email || 'No email'}</p>
                            <p>{customer.user?.phone || 'No phone'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        getStatusColor(customer.subscription?.status || 'INACTIVE')
                      }`}>
                        {customer.subscription?.status || 'INACTIVE'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {/* Address Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <h4 className="font-medium">Address</h4>
                      </div>
                      {renderCustomerAddress(customer)}
                    </div>

                    {/* Subscription Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <CreditCardIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <h4 className="font-medium">Subscription</h4>
                      </div>
                      {renderSubscriptionInfo(customer)}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end space-x-4">
                    <button
                      onClick={() => router.push(`/admin/customers/${customer.id}/billing`)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <CreditCardIcon className="h-4 w-4 mr-2" />
                      Billing
                    </button>
                    <button
                      onClick={() => router.push(`/admin/customers/${customer.id}/edit`)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Edit
                    </button>
                    {customer.subscription?.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleCancelSubscription(customer.id)}
                        className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Cancel Subscription
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
} 