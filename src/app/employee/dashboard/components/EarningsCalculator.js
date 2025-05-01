'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export function EarningsCalculator({ employeeId }) {
  const CardWrapper = ({ children, className }) => {
    return <Card className={className}>{children}</Card>;
  };

  const CardHeaderWrapper = ({ children }) => {
    return <CardHeader>{children}</CardHeader>;
  };

  const CardTitleWrapper = ({ children }) => {
    return <CardTitle>{children}</CardTitle>;
  };

  const CardContentWrapper = ({ children }) => {
    return <CardContent>{children}</CardContent>;
  };
  const [services, setServices] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/employee/services', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      const data = await response.json();
      setServices(data);
      calculateEarnings();
      setLoading(false);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
      setLoading(false);
    }
  };

  const calculateEarnings = () => {
    const date = new Date(selectedDate || new Date().toISOString().split('T')[0]);
    const filteredServices = services.filter(service => {
      const serviceDate = new Date(service.scheduledAt);
      return serviceDate.getDate() === date.getDate() &&
             serviceDate.getMonth() === date.getMonth() &&
             serviceDate.getFullYear() === date.getFullYear();
    });

    let total = 0;
    filteredServices.forEach(service => {
      total += service.price || 0;
    });

    setTotalEarnings(total);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    calculateEarnings();
  };

  if (loading) {
    return (
      <CardWrapper className="animate-pulse">
        <CardHeaderWrapper>
          <CardTitleWrapper>Loading...</CardTitleWrapper>
        </CardHeaderWrapper>
        <CardContentWrapper>
          <div className="space-y-4 p-6">
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-4 bg-gray-200 rounded w-20" />
          </div>
        </CardContentWrapper>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper>
      <CardHeaderWrapper>
        <CardTitleWrapper>Earnings Calculator</CardTitleWrapper>
      </CardHeaderWrapper>
      <CardContentWrapper>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <Input
              type="date"
              value={selectedDate}
              onChange={function(e) { setSelectedDate(e.target.value) }}
              className="mt-2"
            />
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Earnings Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Services</span>
                <span className="font-medium">{services.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Earnings</span>
                <span className="font-medium text-green-600">
                  ${totalEarnings.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Services Today</h3>
            <div className="space-y-4">
              {services.map((service) => (
                <div key={service.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{service.customerName}</p>
                    <p className="text-sm text-gray-500">{service.address}</p>
                  </div>
                  <span className="font-medium text-green-600">
                    ${service.price?.toFixed(2)}
                  </span>
                </div>
              ))}
              {services.length === 0 && (
                <p className="text-gray-500 text-center py-4">No services scheduled for today</p>
              )}
            </div>
          </div>
        </div>
      </CardContentWrapper>
    </CardWrapper>
  );
}
