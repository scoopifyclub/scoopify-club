'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Bell, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

export function Notifications({ onUnreadCountChange, settings }) {
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
      // Filter notifications by settings
      let filtered = data;
      if (settings) {
        filtered = data.filter(n => {
          if (n.type === 'ONBOARDING_REMINDER') return settings.onboarding !== false;
          if (n.type === 'job') return settings.job !== false;
          if (n.type === 'payment') return settings.payment !== false;
          return true; // Show all others
        });
      }
      // Play sound if enabled and new notification arrived
      if (settings && settings.sound && filtered.length > notifications.length) {
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.value = 880;
          g.gain.value = 0.07;
          o.connect(g);
          g.connect(ctx.destination);
          o.start();
          o.stop(ctx.currentTime + 0.15);
        } catch (e) { /* ignore */ }
      }
      setNotifications(filtered);
      setLoading(false);
      // Notify parent of unread count
      if (typeof onUnreadCountChange === 'function') {
        const unread = Array.isArray(filtered) ? filtered.filter(n => !n.read).length : 0;
        onUnreadCountChange(unread);
      }
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
          {notifications.map((notification) => {
            let icon = <Info className="h-5 w-5 text-blue-500 mr-2" />;
            let bg = 'bg-blue-50';
            let text = 'text-blue-800';
            if (notification.type === 'success') {
              icon = <CheckCircle className="h-5 w-5 text-green-500 mr-2" />;
              bg = 'bg-green-50';
              text = 'text-green-800';
            } else if (notification.type === 'error') {
              icon = <XCircle className="h-5 w-5 text-red-500 mr-2" />;
              bg = 'bg-red-50';
              text = 'text-red-800';
            } else if (notification.type === 'warning') {
              icon = <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />;
              bg = 'bg-yellow-50';
              text = 'text-yellow-800';
            } else if (notification.type === 'ONBOARDING_REMINDER') {
              icon = <Bell className="h-5 w-5 text-orange-500 mr-2 animate-bounce" />;
              bg = 'bg-orange-50 border-l-4 border-orange-400';
              text = 'text-orange-800';
            }
            return (
              <div
                key={notification.id}
                className={`p-4 rounded-lg flex ${bg} ${text} items-start mb-2`}
              >
                <div className="flex-shrink-0 mt-1">{icon}</div>
                <div className="flex-1 ml-2">
                  <h3 className="font-medium">
                    {notification.title}
                  </h3>
                  <p className="text-sm text-gray-700 mt-1">
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
                    className="ml-4"
                  >
                    Mark as Read
                  </Button>
                )}
              </div>
            );
          })}
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
