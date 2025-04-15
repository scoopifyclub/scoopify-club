'use client';

import { useState, useEffect } from 'react';
import { Clock, XCircle, Calendar, User } from 'lucide-react';

interface HistoryItem {
  type: 'extension' | 'cancellation';
  id: string;
  serviceId: string;
  customerName: string;
  reason?: string;
  minutes?: number;
  createdAt: string;
}

interface ServiceHistoryProps {
  employeeId: string;
}

export default function ServiceHistory({ employeeId }: ServiceHistoryProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [employeeId]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`/api/employee/time-extensions?employeeId=${employeeId}`);
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading history...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        No history recorded
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Recent Activity</h3>
      <div className="space-y-3">
        {history.map((item) => (
          <div key={item.id} className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{item.customerName}</span>
            </div>
            
            {item.type === 'extension' ? (
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span>Extended by {item.minutes} minutes</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span>Service Cancelled</span>
              </div>
            )}

            {item.reason && (
              <div className="text-sm text-gray-600 mb-2">
                Reason: {item.reason}
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(item.createdAt).toLocaleDateString()} at{' '}
                {new Date(item.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 