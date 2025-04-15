'use client';

import { useState, useEffect } from 'react';
import { Clock, User, Calendar } from 'lucide-react';

interface TimeExtension {
  id: string;
  serviceId: string;
  customerName: string;
  minutes: number;
  reason?: string;
  createdAt: string;
}

interface TimeExtensionHistoryProps {
  employeeId: string;
}

export default function TimeExtensionHistory({ employeeId }: TimeExtensionHistoryProps) {
  const [extensions, setExtensions] = useState<TimeExtension[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExtensions();
  }, [employeeId]);

  const fetchExtensions = async () => {
    try {
      const response = await fetch(`/api/employee/${employeeId}/time-extensions`);
      const data = await response.json();
      setExtensions(data);
    } catch (error) {
      console.error('Error fetching time extensions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading extension history...</div>;
  }

  if (extensions.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        No time extensions recorded
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Recent Time Extensions</h3>
      <div className="space-y-3">
        {extensions.map((extension) => (
          <div key={extension.id} className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{extension.customerName}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>Extended by {extension.minutes} minutes</span>
            </div>
            {extension.reason && (
              <div className="text-sm text-gray-600 mb-2">
                Reason: {extension.reason}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(extension.createdAt).toLocaleDateString()} at{' '}
                {new Date(extension.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 