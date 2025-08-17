import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/api-auth';

// GET: Get all conversations for the authenticated user
export async function GET(request) {
    try {
        const user = await getAuthUser(request);
        if (!user?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const serviceId = searchParams.get('serviceId');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        let conversations;
        
        if (user.role === 'CUSTOMER') {
            // Get conversations for customer
            conversations = await prisma.conversation.findMany({
                where: {
                    customerId: user.customerId,
                    status: 'ACTIVE'
                },
                include: {
                    employee: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    image: true
                                }
                            }
                        }
                    },
                    service: {
                        select: {
                            id: true,
                            scheduledDate: true,
                            servicePlan: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        include: {
                            sender: {
                                select: {
                                    name: true,
                                    image: true
                                }
                            }
                        }
                    },
                    _count: {
                        select: {
                            messages: true
                        }
                    }
                },
                orderBy: { lastMessageAt: 'desc' },
                take: limit,
                skip: offset
            });
        } else if (user.role === 'EMPLOYEE') {
            // Get conversations for employee
            conversations = await prisma.conversation.findMany({
                where: {
                    employeeId: user.employeeId,
                    status: 'ACTIVE'
                },
                include: {
                    customer: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    image: true
                                }
                            },
                            address: true
                        }
                    },
                    service: {
                        select: {
                            id: true,
                            scheduledDate: true,
                            servicePlan: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        include: {
                            sender: {
                                select: {
                                    name: true,
                                    image: true
                                }
                            }
                        }
                    },
                    _count: {
                        select: {
                            messages: true
                        }
                    }
                },
                orderBy: { lastMessageAt: 'desc' },
                take: limit,
                skip: offset
            });
        } else {
            return NextResponse.json({ error: 'Invalid user role' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            conversations,
            pagination: {
                limit,
                offset,
                total: conversations.length
            }
        });

    } catch (error) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json({
            error: 'Failed to fetch conversations',
            details: error.message
        }, { status: 500 });
    }
}

// POST: Create a new conversation or get existing one
export async function POST(request) {
    try {
        const user = await getAuthUser(request);
        if (!user?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { employeeId, serviceId, initialMessage } = await request.json();

        if (!employeeId) {
            return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
        }

        // Check if conversation already exists
        let conversation = await prisma.conversation.findFirst({
            where: {
                customerId: user.customerId,
                employeeId: employeeId,
                serviceId: serviceId || null,
                status: 'ACTIVE'
            },
            include: {
                employee: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                image: true
                            }
                        }
                    }
                },
                customer: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                image: true
                            }
                        }
                    }
                }
            }
        });

        if (!conversation) {
            // Create new conversation
            conversation = await prisma.conversation.create({
                data: {
                    customerId: user.customerId,
                    employeeId: employeeId,
                    serviceId: serviceId || null,
                    status: 'ACTIVE'
                },
                include: {
                    employee: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    image: true
                                }
                            }
                        }
                    },
                    customer: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    image: true
                                }
                            }
                        }
                    }
                }
            });
        }

        // If initial message provided, send it
        if (initialMessage && initialMessage.trim()) {
            const message = await prisma.chatMessage.create({
                data: {
                    conversationId: conversation.id,
                    senderId: user.userId,
                    receiverId: conversation.employee.userId,
                    content: initialMessage.trim(),
                    messageType: 'TEXT'
                },
                include: {
                    sender: {
                        select: {
                            name: true,
                            image: true
                        }
                    }
                }
            });

            // Update conversation last message time
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: { lastMessageAt: new Date() }
            });

            conversation.messages = [message];
        }

        return NextResponse.json({
            success: true,
            conversation
        });

    } catch (error) {
        console.error('Error creating conversation:', error);
        return NextResponse.json({
            error: 'Failed to create conversation',
            details: error.message
        }, { status: 500 });
    }
}
