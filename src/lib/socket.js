import { Server } from 'socket.io';

let io;

export function initSocket(server) {
    if (!io) {
        io = new Server(server, {
            cors: {
                origin: process.env.NEXT_PUBLIC_APP_URL,
                methods: ['GET', 'POST']
            }
        });

        io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            // Join user-specific room for private notifications
            socket.on('join', (userId) => {
                socket.join(`user-${userId}`);
                console.log(`User ${userId} joined their private room`);
            });

            // Join service-specific room for service updates
            socket.on('joinService', (serviceId) => {
                socket.join(`service-${serviceId}`);
                console.log(`Joined service room: ${serviceId}`);
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });
    }
    return io;
}

export function emitServiceUpdate(serviceId, update) {
    if (io) {
        io.to(`service-${serviceId}`).emit('serviceUpdate', update);
    }
}

export function emitUserNotification(userId, notification) {
    if (io) {
        io.to(`user-${userId}`).emit('notification', notification);
    }
}

export function emitServiceStatusChange(serviceId, status, details) {
    if (io) {
        io.to(`service-${serviceId}`).emit('statusChange', {
            serviceId,
            status,
            details,
            timestamp: new Date().toISOString()
        });
    }
}

export function broadcastToRole(role, event, data) {
    if (io) {
        io.to(`role-${role}`).emit(event, data);
    }
} 