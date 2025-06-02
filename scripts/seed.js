// Create test services
console.log('Creating test services...');

// First, create a service plan
const servicePlan = await prisma.servicePlan.upsert({
  where: { id: 'test-plan-1' },
  update: {},
  create: {
    id: 'test-plan-1',
    name: 'Weekly Cleanup',
    description: 'Weekly dog waste removal service',
    price: 25.00,
    duration: 30,
    type: 'WEEKLY',
    isActive: true,
  },
});

// Create some test services
const testServices = [
  {
    id: 'service-1',
    customerId: customer.id,
    scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    servicePlanId: servicePlan.id,
    status: 'PENDING',
    potentialEarnings: 25.00,
  },
  {
    id: 'service-2',
    customerId: customer.id,
    scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
    servicePlanId: servicePlan.id,
    status: 'PENDING',
    potentialEarnings: 25.00,
  },
  {
    id: 'service-3',
    customerId: customer.id,
    scheduledDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last week
    servicePlanId: servicePlan.id,
    employeeId: employee.id,
    status: 'COMPLETED',
    completedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    potentialEarnings: 25.00,
  },
];

for (const serviceData of testServices) {
  await prisma.service.upsert({
    where: { id: serviceData.id },
    update: {},
    create: serviceData,
  });
}

// Create test earnings for completed service
await prisma.earning.upsert({
  where: { id: 'earning-1' },
  update: {},
  create: {
    id: 'earning-1',
    amount: 25.00,
    status: 'PAID',
    serviceId: 'service-3',
    employeeId: employee.id,
    paidAt: new Date(),
    approvedAt: new Date(),
  },
});

console.log('Test services created successfully!'); 