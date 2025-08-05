import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/api-auth';

export async function GET(request) {
  const { userId } = getUserFromToken(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 50;
    const conversationId = searchParams.get('conversationId');

    // Get employee
    const employee = await prisma.employee.findUnique({
      where: { userId }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    if (conversationId) {
      // Get messages for a specific conversation
      const messages = await prisma.chatMessage.findMany({
        where: {
          OR: [
            { senderId: employee.userId },
            { receiverId: employee.userId }
          ],
          id: conversationId
        },
        orderBy: {
          createdAt: 'asc'
        },
        take: limit
      });

      return NextResponse.json(messages);
    } else {
      // Get all conversations for the employee
      const conversations = await prisma.chatMessage.findMany({
        where: {
          OR: [
            { senderId: employee.userId },
            { receiverId: employee.userId }
          ]
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });

      // Group messages by conversation
      const conversationMap = new Map();
      conversations.forEach(message => {
        const otherUserId = message.senderId === employee.userId 
          ? message.receiverId 
          : message.senderId;
        
        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            userId: otherUserId,
            user: message.senderId === employee.userId 
              ? message.receiver 
              : message.sender,
            lastMessage: message,
            unreadCount: 0
          });
        }
      });

      // Get unread counts
      const unreadMessages = await prisma.chatMessage.findMany({
        where: {
          receiverId: employee.userId,
          read: false
        }
      });

      unreadMessages.forEach(message => {
        const conversation = conversationMap.get(message.senderId);
        if (conversation) {
          conversation.unreadCount++;
        }
      });

      return NextResponse.json(Array.from(conversationMap.values()));
    }

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const { userId } = getUserFromToken(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { receiverId, content, serviceId } = await request.json();

    if (!receiverId || !content) {
      return NextResponse.json(
        { error: 'Receiver ID and content are required' },
        { status: 400 }
      );
    }

    // Get employee
    const employee = await prisma.employee.findUnique({
      where: { userId }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Create the message
    const message = await prisma.chatMessage.create({
      data: {
        senderId: employee.userId,
        receiverId,
        content,
        read: false
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Create notification for the receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'MESSAGE',
        title: 'New Message',
        message: `You have a new message from ${employee.User?.name || 'Employee'}`,
        metadata: {
          messageId: message.id,
          senderId: employee.userId,
          serviceId
        }
      }
    });

    return NextResponse.json(message);

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const { userId } = getUserFromToken(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { messageIds } = await request.json();

    if (!messageIds || !Array.isArray(messageIds)) {
      return NextResponse.json(
        { error: 'Message IDs are required' },
        { status: 400 }
      );
    }

    // Mark messages as read
    await prisma.chatMessage.updateMany({
      where: {
        id: {
          in: messageIds
        },
        receiverId: userId
      },
      data: {
        read: true
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to update messages' },
      { status: 500 }
    );
  }
} 