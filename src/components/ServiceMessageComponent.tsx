import { useState, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';

interface ServiceMessageProps {
  serviceId: string;
}

interface Message {
  id: string;
  message: string;
  createdAt: string;
  employee: {
    id: string;
    user: {
      name: string;
      image: string | null;
    };
  };
}

export default function ServiceMessageComponent({ serviceId }: ServiceMessageProps) {
  const { data: session } = useSession();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showMessages, setShowMessages] = useState(false);

  // Fetch messages when the component loads or serviceId changes
  useEffect(() => {
    if (showMessages) {
      fetchMessages();
    }
  }, [serviceId, showMessages]);

  const fetchMessages = async () => {
    setLoadingMessages(true);
    try {
      const response = await fetch(`/api/services/messages?serviceId=${serviceId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/services/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId,
          message: message.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const newMessage = await response.json();
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get the first letter of the name for the avatar fallback
  const getInitials = (name: string) => {
    return name?.charAt(0).toUpperCase() || '?';
  };

  // Format the date as a relative time
  const formatMessageDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'some time ago';
    }
  };

  if (!showMessages) {
    return (
      <Button 
        variant="ghost" 
        className="w-full justify-start text-blue-600"
        onClick={() => setShowMessages(true)}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        View Message History
      </Button>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Messages</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setShowMessages(false)}
        >
          Hide
        </Button>
      </div>

      {loadingMessages ? (
        <div className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4 max-h-60 overflow-y-auto p-2">
          {messages.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">No messages yet</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={msg.employee.user.image || undefined} />
                  <AvatarFallback>{getInitials(msg.employee.user.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium">{msg.employee.user.name}</p>
                      <p className="text-xs text-gray-500">{formatMessageDate(msg.createdAt)}</p>
                    </div>
                    <p className="text-sm mt-1">{msg.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          className="w-full rounded-md border border-gray-300 p-2 text-sm"
          rows={2}
        />
        <Button
          type="submit"
          disabled={!message.trim() || loading}
          size="sm"
          className="w-full"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Message
            </>
          )}
        </Button>
      </form>
    </div>
  );
} 