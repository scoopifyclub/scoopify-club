import { NextResponse } from 'next/server';
import { withAdminDatabase } from '@/lib/prisma';
import { validateUserToken } from '@/lib/jwt-utils';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request) {
    try {
        const token = request.headers.get('authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

                       const decoded = await validateUserToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '30days';

        const exportData = await withAdminDatabase(async (prisma) => {
            console.log('📊 Exporting admin reports...');

            // Calculate date range
            const now = new Date();
            let startDate;
            switch (range) {
                case '7days':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30days':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case '90days':
                    startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            }

            // Get services data for export
            const services = await prisma.service.findMany({
                where: {
                    createdAt: { gte: startDate }
                },
                include: {
                    customer: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    email: true
                                }
                            }
                        }
                    },
                    employee: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    email: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            // Get payments data for export
            const payments = await prisma.payment.findMany({
                where: {
                    createdAt: { gte: startDate }
                },
                include: {
                    service: {
                        include: {
                                                    customer: {
                            include: {
                                user: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        }
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            return { services, payments };
        });

        // Generate CSV content
        const csvContent = generateCSV(exportData, range);
        
        // Create response with CSV headers
        const response = new NextResponse(csvContent);
        response.headers.set('Content-Type', 'text/csv');
        response.headers.set('Content-Disposition', `attachment; filename="admin-reports-${range}-${new Date().toISOString().split('T')[0]}.csv"`);
        
        return response;

    } catch (error) {
        console.error('Error exporting reports:', error);
        return NextResponse.json({ 
            success: false,
            error: 'Failed to export reports' 
        }, { status: 500 });
    }
}

function generateCSV(data, range) {
    const { services, payments } = data;
    
    let csv = `Admin Reports Export - ${range}\n`;
    csv += `Generated: ${new Date().toISOString()}\n\n`;
    
    // Services section
    csv += `Services\n`;
    csv += `ID,Type,Status,Customer,Employee,Scheduled Date,Price,Created Date\n`;
    services.forEach(service => {
        csv += `${service.id},${service.type || 'N/A'},${service.status || 'N/A'},${service.customer?.User?.name || 'N/A'},${service.employee?.User?.name || 'N/A'},${service.scheduledDate || 'N/A'},${service.price || 'N/A'},${service.createdAt || 'N/A'}\n`;
    });
    
    csv += `\nPayments\n`;
    csv += `ID,Amount,Status,Customer,Service,Payment Date\n`;
    payments.forEach(payment => {
        csv += `${payment.id},${payment.amount || 'N/A'},${payment.status || 'N/A'},${payment.service?.customer?.User?.name || 'N/A'},${payment.serviceId || 'N/A'},${payment.createdAt || 'N/A'}\n`;
    });
    
    return csv;
}
