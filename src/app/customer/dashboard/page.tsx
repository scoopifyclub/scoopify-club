'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Image from 'next/image';
import { toast } from 'sonner';

interface Service {
  id: string;
  type: string;
  status: string;
  scheduledFor: string;
  completedAt: string | null;
  amount: number;
  description: string;
  photos: {
    id: string;
    url: string;
    type: 'BEFORE' | 'AFTER';
  }[];
  employee: {
    name: string;
  } | null;
}

interface Subscription {
  id: string;
  status: string;
  startDate: string;
  nextBillingDate: string;
  plan: {
    name: string;
    price: number;
    frequency: string;
  };
}

interface Customer {
  id: string;
  phone: string | null;
  gateCode: string | null;
  serviceDay: string | null;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  } | null;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  date: string;
  description: string;
}

export default function CustomerDashboard() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    gateCode: '',
    serviceDay: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    preferences: {
      grassHeight: 3,
      specialInstructions: '',
      serviceAreas: ['FRONT_YARD', 'BACK_YARD'],
      addOns: [],
    },
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch services
        const servicesRes = await fetch('/api/customer/services', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!servicesRes.ok) throw new Error('Failed to fetch services');
        const servicesData = await servicesRes.json();
        setServices(servicesData);

        // Fetch subscription
        const subscriptionRes = await fetch('/api/customer/subscription', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (subscriptionRes.ok) {
          const subscriptionData = await subscriptionRes.json();
          setSubscription(subscriptionData);
        }

        // Fetch customer profile
        const customerRes = await fetch('/api/customer/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (customerRes.ok) {
          const customerData = await customerRes.json();
          setCustomer(customerData);
          setFormData({
            phone: customerData.phone || '',
            gateCode: customerData.gateCode || '',
            serviceDay: customerData.serviceDay || '',
            address: customerData.address || {
              street: '',
              city: '',
              state: '',
              zipCode: '',
            },
            preferences: customerData.preferences || {
              grassHeight: 3,
              specialInstructions: '',
              serviceAreas: ['FRONT_YARD', 'BACK_YARD'],
              addOns: [],
            },
          });
        }

        // Fetch payments
        const paymentsRes = await fetch('/api/customer/payments', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!paymentsRes.ok) throw new Error('Failed to fetch payments');
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleUpdateProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update profile');
      
      const updatedCustomer = await response.json();
      setCustomer(updatedCustomer);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const handleScheduleService = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/customer/services', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduledFor: new Date().toISOString(),
          preferences: formData.preferences,
        }),
      });

      if (!response.ok) throw new Error('Failed to schedule service');
      
      const newService = await response.json();
      setServices([newService, ...services]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule service');
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/subscriptions', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to cancel subscription');
      
      const updatedSubscription = await response.json();
      setSubscription(updatedSubscription);
      toast.success('Subscription cancelled successfully');
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      toast.error('Failed to cancel subscription');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {/* Account Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-blue-600 hover:text-blue-800"
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateProfile(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gate Code</label>
                  <input
                    type="text"
                    value={formData.gateCode}
                    onChange={(e) => setFormData({ ...formData, gateCode: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Service Day</label>
                  <select
                    value={formData.serviceDay}
                    onChange={(e) => setFormData({ ...formData, serviceDay: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="MONDAY">Monday</option>
                    <option value="TUESDAY">Tuesday</option>
                    <option value="WEDNESDAY">Wednesday</option>
                    <option value="THURSDAY">Thursday</option>
                    <option value="FRIDAY">Friday</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Street</label>
                    <input
                      type="text"
                      value={formData.address.street}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, street: e.target.value }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <input
                      type="text"
                      value={formData.address.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <input
                      type="text"
                      value={formData.address.state}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, state: e.target.value }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                    <input
                      type="text"
                      value={formData.address.zipCode}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, zipCode: e.target.value }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Service Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Grass Height (inches)</label>
                    <input
                      type="number"
                      value={formData.preferences.grassHeight}
                      onChange={(e) => setFormData({
                        ...formData,
                        preferences: { ...formData.preferences, grassHeight: Number(e.target.value) }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Service Areas</label>
                    <div className="mt-2 space-y-2">
                      {['FRONT_YARD', 'BACK_YARD', 'SIDE_YARD'].map((area) => (
                        <label key={area} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.preferences.serviceAreas.includes(area)}
                            onChange={(e) => {
                              const newAreas = e.target.checked
                                ? [...formData.preferences.serviceAreas, area]
                                : formData.preferences.serviceAreas.filter(a => a !== area);
                              setFormData({
                                ...formData,
                                preferences: { ...formData.preferences, serviceAreas: newAreas }
                              });
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{area.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Special Instructions</label>
                    <textarea
                      value={formData.preferences.specialInstructions}
                      onChange={(e) => setFormData({
                        ...formData,
                        preferences: { ...formData.preferences, specialInstructions: e.target.value }
                      })}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{customer?.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Gate Code</p>
                <p className="font-medium">{customer?.gateCode || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Service Day</p>
                <p className="font-medium">{customer?.serviceDay}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">
                  {customer?.address.street}
                  <br />
                  {customer?.address.city}, {customer?.address.state} {customer?.address.zipCode}
                </p>
              </div>
              {customer?.preferences && (
                <>
                  <div>
                    <p className="text-sm text-gray-500">Preferred Grass Height</p>
                    <p className="font-medium">{customer.preferences.grassHeight} inches</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Service Areas</p>
                    <p className="font-medium">
                      {customer.preferences.serviceAreas.map(area => area.replace('_', ' ')).join(', ')}
                    </p>
                  </div>
                  {customer.preferences.specialInstructions && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500">Special Instructions</p>
                      <p className="font-medium">{customer.preferences.specialInstructions}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Subscription Information */}
        {subscription && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Subscription</h2>
              <button
                onClick={handleCancelSubscription}
                disabled={subscription.status === 'CANCELLED'}
                className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel Subscription
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Plan</p>
                <p className="font-medium">{subscription.plan.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium capitalize">{subscription.status.toLowerCase()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Next Billing Date</p>
                <p className="font-medium">
                  {format(new Date(subscription.nextBillingDate), 'MMMM d, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Price</p>
                <p className="font-medium">
                  ${subscription.plan.price}/{subscription.plan.frequency}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment History */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment History</h2>
          {payments.length === 0 ? (
            <p className="text-gray-500">No payments found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(payment.date), 'MMMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${payment.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          payment.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                          payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {payment.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Service History */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Service History</h2>
            <button
              onClick={handleScheduleService}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Schedule Service
            </button>
          </div>
          {services.length === 0 ? (
            <p className="text-gray-500">No services completed yet.</p>
          ) : (
            <div className="space-y-8">
              {services.map((service) => (
                <div key={service.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-medium">
                        {format(new Date(service.scheduledFor), 'MMMM d, yyyy')}
                      </p>
                      <p className="text-sm text-gray-500 capitalize">{service.status}</p>
                    </div>
                    {service.employee && (
                      <div className="text-right">
                        <p className="font-medium">{service.employee.name}</p>
                      </div>
                    )}
                  </div>

                  {service.photos.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Photos</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {service.photos.map((photo) => (
                          <div key={photo.id} className="relative aspect-video">
                            <Image
                              src={photo.url}
                              alt={`${photo.type} service photo`}
                              fill
                              className="object-cover rounded-lg"
                            />
                            <span className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                              {photo.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {service.description && (
                    <p className="mt-4 text-sm text-gray-600">{service.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 