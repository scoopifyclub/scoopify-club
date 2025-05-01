'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/employee/notifications', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data = await response.json();
      setNotifications(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch('/api/employee/notifications/mark-read', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId })
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      toast.success('Notification marked as read');
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="space-y-4 p-6">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg ${
                notification.type === 'success' ? 'bg-green-50' :
                notification.type === 'error' ? 'bg-red-50' :
                notification.type === 'warning' ? 'bg-yellow-50' :
                'bg-blue-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">
                    {notification.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                {!notification.read && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAsRead(notification.id)}
                  >
                    Mark as Read
                  </Button>
                )}
              </div>
            </div>
          ))}
          {notifications.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              No notifications yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
