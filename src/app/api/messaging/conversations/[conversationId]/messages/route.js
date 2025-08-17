import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/api-auth';

// GET: Get messages for a specific conversation
export async function GET(request, { params }) {
    try {
        const user = await getAuthUser(request);
        if (!user?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { conversationId } = await params;
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Verify user has access to this conversation
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                customer: true,
                employee: true
            }
        });

        if (!conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        // Check if user is part of this conversation
        const isCustomer = user.role === 'CUSTOMER' && conversation.customerId === user.customerId;
        const isEmployee = user.role === 'EMPLOYEE' && conversation.employeeId === user.employeeId;
        
        if (!isCustomer && !isEmployee) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Get messages
        const messages = await prisma.chatMessage.findMany({
            where: { conversationId },
            include: {
                sender: {
                    select: {
                        name: true,
                        image: true
                    }
                },
                receiver: {
                    select: {
                        name: true,
                        image: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset
        });

        // Mark messages as read if user is the receiver
        const unreadMessages = messages.filter(msg => 
            msg.receiverId === user.userId && !msg.read
        );

        if (unreadMessages.length > 0) {
            await prisma.chatMessage.updateMany({
                where: {
                    id: { in: unreadMessages.map(msg => msg.id) }
                },
                data: {
                    read: true,
                    readAt: new Date()
                }
            });
        }

        // Get total message count
        const totalMessages = await prisma.chatMessage.count({
            where: { conversationId }
        });

        return NextResponse.json({
            success: true,
            messages: messages.reverse(), // Return in chronological order
            pagination: {
                limit,
                offset,
                total: totalMessages,
                hasMore: offset + limit < totalMessages
            }
        });

    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({
            error: 'Failed to fetch messages',
            details: error.message
        }, { status: 500 });
    }
}

// POST: Send a new message
export async function POST(request, { params }) {
    try {
        const user = await getAuthUser(request);
        if (!user?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { conversationId } = await params;
        const { content, messageType = 'TEXT', attachments = [], metadata = {} } = await request.json();

        if (!content || !content.trim()) {
            return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
        }

        // Verify user has access to this conversation
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                customer: true,
                employee: true
            }
        });

        if (!conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        // Check if user is part of this conversation
        const isCustomer = user.role === 'CUSTOMER' && conversation.customerId === user.customerId;
        const isEmployee = user.role === 'EMPLOYEE' && conversation.employeeId === user.employeeId;
        
        if (!isCustomer && !isEmployee) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Determine receiver ID
        let receiverId;
        if (isCustomer) {
            receiverId = conversation.employee.userId;
        } else {
            receiverId = conversation.customer.userId;
        }

        // Create the message
        const message = await prisma.chatMessage.create({
            data: {
                conversationId,
                senderId: user.userId,
                receiverId,
                content: content.trim(),
                messageType,
                attachments,
                metadata
            },
            include: {
                sender: {
                    select: {
                        name: true,
                        image: true
                    }
                },
                receiver: {
                    select: {
                        name: true,
                        image: true
                    }
                }
            }
        });

        // Update conversation last message time
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { lastMessageAt: new Date() }
        });

        return NextResponse.json({
            success: true,
            message
        });

    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json({
            error: 'Failed to send message',
            details: error.message
        }, { status: 500 });
    }
}
