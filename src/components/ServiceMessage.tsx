'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { MessageSquare, Send } from 'lucide-react';

interface ServiceMessageProps {
  serviceId: string;
  employeeId: string;
}

export default function ServiceMessage({ serviceId, employeeId }: ServiceMessageProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{
    id: string;
    message: string;
    createdAt: string;
  }>>([]);

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
          employeeId,
          message: message.trim(),
        }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages(prev => [...prev, newMessage]);
        setMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-semibold">Messages</h3>
      </div>

      <div className="space-y-4 max-h-60 overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg.id} className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm">{msg.message}</p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(msg.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Leave a message for the customer..."
          className="w-full rounded-md border border-gray-300 p-2"
          rows={2}
        />
        <Button
          type="submit"
          disabled={!message.trim() || loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Send className="mr-2 h-4 w-4 animate-spin" />
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