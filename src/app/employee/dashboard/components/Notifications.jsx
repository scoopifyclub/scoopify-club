'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Bell, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

export function Notifications({ onUnreadCountChange, settings, notifications: propNotifications, employeeId }) {
  const [notifications, setNotifications] = useState(propNotifications || []);
  const [loading, setLoading] = useState(!propNotifications);

  // Update local state when props change
  useEffect(() => {
    if (propNotifications) {
      setNotifications(propNotifications);
      setLoading(false);
    }
  }, [propNotifications]);

  const fetchNotifications = async () => {
    // Only fetch if we don't have notifications from props
    if (propNotifications) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/employee/notifications', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data = await response.json();
      console.log('🔔 Notifications API response:', data); // Debug log
      
      // Filter notifications by settings
      let filtered = data.notifications || data; // Handle both data.notifications and direct array
      console.log('🔔 Filtered notifications:', filtered); // Debug log
      
      if (settings) {
        filtered = filtered.filter(n => {
          if (n.type === 'ONBOARDING_REMINDER') return settings.onboarding !== false;
          if (n.type === 'job') return settings.job !== false;
          if (n.type === 'payment') return settings.payment !== false;
          return true; // Show all others
        });
      }
      // Play sound if enabled and new notification arrived
      if (settings && settings.sound && filtered.length > 0) {
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

  useEffect(() => {
    // Only set up polling if we're fetching our own notifications
    if (!propNotifications) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, []); // Empty dependency array since we only want this to run once

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
          {Array.isArray(notifications) && notifications.map((notification) => {
            // Add safety checks
            if (!notification || !notification.id) {
              console.warn('Invalid notification:', notification);
              return null;
            }

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
                    {notification.title || 'Notification'}
                  </h3>
                  <p className="text-sm text-gray-700 mt-1">
                    {notification.message || 'No message'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : 'Unknown date'}
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
          {(!Array.isArray(notifications) || notifications.length === 0) && (
            <p className="text-gray-500 text-center py-4">
              {!Array.isArray(notifications) ? 'Loading notifications...' : 'No notifications yet'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
