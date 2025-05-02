import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NotificationsDropdown({ userType }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (open) fetchNotifications();
    // Optionally, poll for new notifications in the background
    // const interval = setInterval(fetchNotifications, 30000);
    // return () => clearInterval(interval);
  }, [open]);

  const fetchNotifications = async () => {
    setLoading(true);
    let url = '/api/notifications';
    if (userType === 'scooper') url = '/api/employee/notifications';
    else if (userType === 'admin') url = '/api/admin/notifications';
    else if (userType === 'customer') url = '/api/customer/notifications';
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const data = await res.json();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (err) {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id })
    });
    fetchNotifications();
  };

  return (
    <div className="relative inline-block text-left">
      <button className="relative" onClick={() => setOpen(!open)} aria-label="Notifications">
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs px-1.5 py-0.5">{unreadCount}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-96 z-50">
          <Card className="shadow-lg border">
            <CardContent className="p-4 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-blue-700">Notifications</span>
                <Button
                  size="sm"
                  variant="outline"
                  aria-label="Mark all notifications as read"
                  onClick={async () => {
                    let url = '/api/notifications/mark-all-read';
                    if (userType === 'scooper') url = '/api/employee/notifications/mark-all-read';
                    else if (userType === 'admin') url = '/api/admin/notifications/mark-all-read';
                    else if (userType === 'customer') url = '/api/customer/notifications/mark-all-read';
                    await fetch(url, { method: 'POST', credentials: 'include' });
                    fetchNotifications();
                  }}
                >
                  Mark all as read
                </Button>
              </div>
              {loading ? (
                <div>Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="text-gray-500 text-center">No notifications</div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className={`p-3 rounded mb-2 ${n.read ? 'bg-gray-50' : 'bg-blue-50'}`}> 
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold">{n.type.replace(/_/g, ' ')}</div>
                        <div className="text-sm text-gray-700">{n.message}</div>
                        <div className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                      {!n.read && (
                        <Button size="sm" variant="outline" onClick={() => markAsRead(n.id)}>Mark as Read</Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
