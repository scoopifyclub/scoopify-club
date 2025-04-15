'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Calendar, Settings, History, CreditCard, MapPin, Clock } from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('upcoming');

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Account</h2>
              <div className="space-y-2">
                <button
                  className={`flex items-center w-full p-2 rounded-lg ${
                    activeTab === 'upcoming' ? 'bg-brand-primary/10 text-brand-primary' : 'hover:bg-neutral-50'
                  }`}
                  onClick={() => setActiveTab('upcoming')}
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Upcoming Services
                </button>
                <button
                  className={`flex items-center w-full p-2 rounded-lg ${
                    activeTab === 'history' ? 'bg-brand-primary/10 text-brand-primary' : 'hover:bg-neutral-50'
                  }`}
                  onClick={() => setActiveTab('history')}
                >
                  <History className="w-5 h-5 mr-2" />
                  Service History
                </button>
                <button
                  className={`flex items-center w-full p-2 rounded-lg ${
                    activeTab === 'billing' ? 'bg-brand-primary/10 text-brand-primary' : 'hover:bg-neutral-50'
                  }`}
                  onClick={() => setActiveTab('billing')}
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Billing
                </button>
                <button
                  className={`flex items-center w-full p-2 rounded-lg ${
                    activeTab === 'settings' ? 'bg-brand-primary/10 text-brand-primary' : 'hover:bg-neutral-50'
                  }`}
                  onClick={() => setActiveTab('settings')}
                >
                  <Settings className="w-5 h-5 mr-2" />
                  Settings
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'upcoming' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">Upcoming Services</h2>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Weekly Service</h3>
                        <p className="text-sm text-neutral-600">Every Monday at 9:00 AM</p>
                      </div>
                      <Button variant="outline">Reschedule</Button>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-neutral-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>123 Pet Care Way, Dogtown, CA 90210</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">Service History</h2>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Weekly Service</h3>
                        <p className="text-sm text-neutral-600">Completed on Monday, March 18, 2024</p>
                      </div>
                      <div className="flex items-center text-sm text-neutral-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>9:00 AM - 9:30 AM</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">Billing Information</h2>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Current Plan</h3>
                    <p className="text-neutral-600">Two Dogs Plan - $70/month</p>
                    <div className="mt-4">
                      <Button>Update Payment Method</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Contact Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700">Email</label>
                        <input
                          type="email"
                          className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary"
                          defaultValue="customer@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700">Phone</label>
                        <input
                          type="tel"
                          className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary"
                          defaultValue="(555) 123-4567"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Service Preferences</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700">Preferred Service Day</label>
                        <select className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary">
                          <option>Monday</option>
                          <option>Tuesday</option>
                          <option>Wednesday</option>
                          <option>Thursday</option>
                          <option>Friday</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Button>Save Changes</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 