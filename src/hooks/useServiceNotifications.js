'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

let socket;

export function useServiceNotifications(serviceId) {
    const { user } = useAuth();
    const [status, setStatus] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!user) return;

        // Initialize socket connection
        if (!socket) {
            socket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001');
        }

        function onConnect() {
            setIsConnected(true);
            // Join user-specific room
            socket.emit('join', user.id);
            // Join service-specific room if serviceId is provided
            if (serviceId) {
                socket.emit('joinService', serviceId);
            }
        }

        function onDisconnect() {
            setIsConnected(false);
        }

        function onServiceUpdate(update) {
            setStatus(update);
            // Show toast notification for service updates
            toast.info(update.message, {
                description: update.details,
            });
        }

        function onStatusChange(change) {
            setStatus(change.status);
            // Show toast notification for status changes
            toast.info(`Service status changed to ${change.status}`, {
                description: change.details,
            });
        }

        function onNotification(notification) {
            // Show toast notification for general notifications
            toast(notification.title, {
                description: notification.message,
            });
        }

        // Set up event listeners
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('serviceUpdate', onServiceUpdate);
        socket.on('statusChange', onStatusChange);
        socket.on('notification', onNotification);

        // Connect to the socket server
        if (!socket.connected) {
            socket.connect();
        }

        // Cleanup function
        return () => {
            if (serviceId) {
                socket.emit('leaveService', serviceId);
            }
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('serviceUpdate', onServiceUpdate);
            socket.off('statusChange', onStatusChange);
            socket.off('notification', onNotification);
        };
    }, [user, serviceId]);

    return {
        isConnected,
        status,
        socket
    };
} 