import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
export async function GET(request) {
    var _a;
    try {
        const token = (_a = request.headers.get('authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decoded = await verifyToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const employees = await prisma.employee.findMany({
            where: {
                status: 'ACTIVE'
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                services: {
                    where: {
                        scheduledDate: {
                            gte: today,
                            lt: tomorrow
                        }
                    },
                    include: {
                        customer: {
                            include: {
                                user: {
                                    select: {
                                        name: true
                                    }
                                },
                                address: true
                            }
                        }
                    }
                }
            }
        });
        const formattedEmployees = await Promise.all(employees.map(async (employee) => {
            // Get current job if any - look for services with status CLAIMED but not completed
            const currentJob = employee.services.find(service => service.status === 'CLAIMED' && !service.completedDate);
            // Calculate today's stats
            const completedServices = employee.services.filter(service => service.status === 'COMPLETED');
            const totalTime = completedServices.reduce((total, service) => {
                if (service.scheduledDate && service.completedDate) {
                    const duration = new Date(service.completedDate).getTime() - new Date(service.scheduledDate).getTime();
                    return total + (duration / 1000 / 60); // Convert to minutes
                }
                return total;
            }, 0);
            return {
                id: employee.id,
                name: employee.user.name,
                email: employee.user.email,
                phone: employee.phone,
                status: currentJob ? 'ON_JOB' : employee.services.some(s => s.status === 'CLAIMED') ? 'ACTIVE' : 'INACTIVE',
                currentJob: currentJob ? {
                    id: currentJob.id,
                    customerName: currentJob.customer.user.name,
                    address: currentJob.customer.address.street,
                    scheduledDate: currentJob.scheduledDate
                } : undefined,
                todayStats: {
                    completed: completedServices.length,
                    totalTime: Math.round(totalTime),
                    averageTime: completedServices.length > 0 ? Math.round(totalTime / completedServices.length) : 0
                }
            };
        }));
        return NextResponse.json({ employees: formattedEmployees });
    }
    catch (error) {
        console.error('Error fetching employee activity:', error);
        return NextResponse.json({ error: 'Failed to fetch employee activity' }, { status: 500 });
    }
}
