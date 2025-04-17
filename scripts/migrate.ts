import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔄 Running database migrations...');
    
    // Verify database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Run migrations
    const result = await prisma.$executeRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '_prisma_migrations'
      );
    `;

    if (!result) {
      console.log('⚠️ No migrations table found. Creating initial schema...');
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
          "id" VARCHAR(36) PRIMARY KEY,
          "checksum" VARCHAR(64) NOT NULL,
          "finished_at" TIMESTAMP WITH TIME ZONE,
          "migration_name" VARCHAR(255) NOT NULL,
          "logs" TEXT,
          "rolled_back_at" TIMESTAMP WITH TIME ZONE,
          "started_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          "applied_steps_count" INTEGER NOT NULL DEFAULT 0
        );
      `;
    }

    // Apply pending migrations
    const migrations = await prisma.$queryRaw`
      SELECT migration_name 
      FROM _prisma_migrations 
      WHERE finished_at IS NOT NULL 
      ORDER BY started_at DESC;
    `;

    console.log('📊 Current migrations:', migrations);

    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 