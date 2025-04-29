import { prisma } from './setup';
// Clean up database after each test
afterEach(async () => {
    await prisma.$executeRawUnsafe('SET session_replication_role = replica;');
    const tables = await prisma.$queryRaw `
    SELECT tablename as name
    FROM pg_tables
    WHERE schemaname = 'public'
  `;
    for (const { name } of tables) {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${name}" CASCADE;`);
    }
    await prisma.$executeRawUnsafe('SET session_replication_role = DEFAULT;');
});
// Disconnect from database after all tests
afterAll(async () => {
    await prisma.$disconnect();
});
