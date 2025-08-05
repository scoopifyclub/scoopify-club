import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedOperationalData() {
    console.log('🌱 Seeding operational efficiency data...\n');

    try {
        // Seed inventory items
        console.log('📦 Adding inventory items...');
        const inventoryItems = [
            {
                name: 'Dog Waste Bags',
                category: 'Supplies',
                quantity: 500,
                minQuantity: 100,
                unit: 'bags',
                cost: 0.15
            },
            {
                name: 'Disposable Gloves',
                category: 'Safety',
                quantity: 200,
                minQuantity: 50,
                unit: 'pairs',
                cost: 0.25
            },
            {
                name: 'Sanitizer Spray',
                category: 'Cleaning',
                quantity: 25,
                minQuantity: 10,
                unit: 'bottles',
                cost: 8.50
            },
            {
                name: 'Trash Bags',
                category: 'Supplies',
                quantity: 150,
                minQuantity: 75,
                unit: 'bags',
                cost: 0.30
            },
            {
                name: 'Safety Vests',
                category: 'Safety',
                quantity: 8,
                minQuantity: 5,
                unit: 'vests',
                cost: 15.00
            },
            {
                name: 'Shovels',
                category: 'Equipment',
                quantity: 12,
                minQuantity: 8,
                unit: 'shovels',
                cost: 25.00
            },
            {
                name: 'Rakes',
                category: 'Equipment',
                quantity: 10,
                minQuantity: 6,
                unit: 'rakes',
                cost: 18.00
            },
            {
                name: 'First Aid Kits',
                category: 'Safety',
                quantity: 3,
                minQuantity: 2,
                unit: 'kits',
                cost: 35.00
            }
        ];

        for (const item of inventoryItems) {
            await prisma.inventoryItem.create({
                data: item
            });
        }
        console.log('✅ Inventory items added successfully');

        // Get some existing services and employees for quality control and feedback
        const services = await prisma.service.findMany({ take: 5 });
        const employees = await prisma.employee.findMany({ take: 3 });
        const customers = await prisma.customer.findMany({ take: 5 });

        let qualityRecords = [];
        let feedbackRecords = [];
        
        if (services.length > 0 && employees.length > 0) {
            // Seed quality control records
            console.log('🔍 Adding quality control records...');
            qualityRecords = [
                {
                    serviceId: services[0].id,
                    employeeId: employees[0].id,
                    photos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
                    notes: 'Service completed successfully. Yard is clean and customer satisfied.',
                    completionTime: new Date(),
                    status: 'COMPLETED'
                },
                {
                    serviceId: services[1]?.id || services[0].id,
                    employeeId: employees[1]?.id || employees[0].id,
                    photos: ['https://example.com/photo3.jpg'],
                    notes: 'Minor issue with gate access, but service completed.',
                    completionTime: new Date(Date.now() - 86400000), // 1 day ago
                    status: 'COMPLETED'
                },
                {
                    serviceId: services[2]?.id || services[0].id,
                    employeeId: employees[0].id,
                    photos: [],
                    notes: 'Service in progress',
                    completionTime: new Date(),
                    status: 'PENDING'
                }
            ];

            for (const record of qualityRecords) {
                await prisma.qualityControl.create({
                    data: record
                });
            }
            console.log('✅ Quality control records added successfully');
        }

        if (services.length > 0 && customers.length > 0) {
            // Seed customer feedback
            console.log('💬 Adding customer feedback...');
            feedbackRecords = [
                {
                    serviceId: services[0].id,
                    customerId: customers[0].id,
                    rating: 5,
                    review: 'Excellent service! The yard looks great and the employee was very professional.',
                    category: 'QUALITY'
                },
                {
                    serviceId: services[1]?.id || services[0].id,
                    customerId: customers[1]?.id || customers[0].id,
                    rating: 4,
                    review: 'Good service overall. Would have given 5 stars but was a bit late.',
                    category: 'TIMELINESS'
                },
                {
                    serviceId: services[2]?.id || services[0].id,
                    customerId: customers[2]?.id || customers[0].id,
                    rating: 5,
                    review: 'Perfect service as always!',
                    category: 'GENERAL'
                },
                {
                    serviceId: services[3]?.id || services[0].id,
                    customerId: customers[3]?.id || customers[0].id,
                    rating: 3,
                    review: 'Service was okay, but communication could be better.',
                    category: 'COMMUNICATION'
                }
            ];

            for (const feedback of feedbackRecords) {
                await prisma.customerFeedback.create({
                    data: feedback
                });
            }
            console.log('✅ Customer feedback added successfully');
        }

        console.log('\n🎉 Operational efficiency data seeding completed!');
        console.log('\n📊 Summary:');
        console.log(`   - ${inventoryItems.length} inventory items`);
        console.log(`   - ${qualityRecords.length} quality control records`);
        console.log(`   - ${feedbackRecords.length} customer feedback records`);

    } catch (error) {
        console.error('❌ Error seeding operational data:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seeding function
seedOperationalData()
    .then(() => {
        console.log('\n✅ Seeding completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Seeding failed:', error);
        process.exit(1);
    }); 