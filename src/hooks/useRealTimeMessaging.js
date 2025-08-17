import { useEffect, useRef, useCallback } from 'react';

export function useRealTimeMessaging(conversationId, onMessageReceived) {
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    const connect = useCallback(() => {
        if (!conversationId) return;

        try {
            // Check if WebSocket URL is configured
            const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 
                (process.env.NODE_ENV === 'production' 
                    ? `wss://${window.location.host}/api/messaging/ws?conversationId=${conversationId}`
                    : `ws://localhost:3000/api/messaging/ws?conversationId=${conversationId}`);

            // If no WebSocket URL is configured, fall back to polling
            if (!process.env.NEXT_PUBLIC_WS_URL) {
                console.warn('WebSocket URL not configured, falling back to polling');
                return;
            }

            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                console.log('WebSocket connected for conversation:', conversationId);
                reconnectAttempts.current = 0;
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'NEW_MESSAGE' && data.conversationId === conversationId) {
                        onMessageReceived(data.message);
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            wsRef.current.onclose = (event) => {
                console.log('WebSocket closed:', event.code, event.reason);
                if (event.code !== 1000) { // Not a normal closure
                    scheduleReconnect();
                }
            };

            wsRef.current.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

        } catch (error) {
            console.error('Error creating WebSocket:', error);
            scheduleReconnect();
        }
    }, [conversationId, onMessageReceived]);

    const scheduleReconnect = useCallback(() => {
        if (reconnectAttempts.current >= maxReconnectAttempts) {
            console.log('Max reconnection attempts reached');
            return;
        }

        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;

        console.log(`Scheduling reconnection attempt ${reconnectAttempts.current} in ${delay}ms`);

        reconnectTimeoutRef.current = setTimeout(() => {
            connect();
        }, delay);
    }, [connect]);

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close(1000, 'Component unmounting');
            wsRef.current = null;
        }

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
    }, []);

    const sendMessage = useCallback((message) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'SEND_MESSAGE',
                conversationId,
                message
            }));
        }
    }, [conversationId]);

    useEffect(() => {
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    // Reconnect when conversationId changes
    useEffect(() => {
        disconnect();
        connect();
    }, [conversationId, connect, disconnect]);

    return {
        sendMessage,
        isConnected: wsRef.current?.readyState === WebSocket.OPEN,
        connect,
        disconnect
    };
}

// Fallback to polling if WebSocket is not available
export function usePollingMessaging(conversationId, onMessageReceived, pollingInterval = 3000) {
    const intervalRef = useRef(null);
    const lastMessageIdRef = useRef(null);

    const pollForMessages = useCallback(async () => {
        if (!conversationId) return;

        try {
            const response = await fetch(`/api/messaging/conversations/${conversationId}/messages?limit=10`);
            if (!response.ok) return;

            const data = await response.json();
            const messages = data.messages || [];

            // Check for new messages
            const newMessages = messages.filter(msg => 
                !lastMessageIdRef.current || msg.id !== lastMessageIdRef.current
            );

            if (newMessages.length > 0) {
                newMessages.forEach(message => {
                    onMessageReceived(message);
                });
                lastMessageIdRef.current = messages[0]?.id;
            }
        } catch (error) {
            console.error('Error polling for messages:', error);
        }
    }, [conversationId, onMessageReceived]);

    useEffect(() => {
        // Initial poll
        pollForMessages();

        // Set up polling interval
        intervalRef.current = setInterval(pollForMessages, pollingInterval);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [pollForMessages, pollingInterval]);

    return {
        isConnected: true, // Always true for polling
        pollNow: pollForMessages
    };
}
