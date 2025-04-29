const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function checkMigrations() {
    console.log('🔍 Checking migrations...');

    // 1. Check for pending migrations
    try {
        console.log('📋 Checking for pending schema changes...');
        execSync('npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --exit-code', { stdio: 'inherit' });
    } catch (error) {
        console.warn('⚠️ Found pending schema changes that need migration');
    }

    // 2. Check migration history
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
        console.log('📁 Creating migrations directory...');
        fs.mkdirSync(migrationsDir, { recursive: true });
    }

    const migrations = fs.readdirSync(migrationsDir)
        .filter(file => fs.statSync(path.join(migrationsDir, file)).isDirectory())
        .sort();

    if (migrations.length === 0) {
        console.log('ℹ️ No migrations found. Creating initial migration...');
        try {
            execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });
            console.log('✅ Initial migration created');
        } catch (error) {
            console.error('❌ Failed to create initial migration:', error.message);
            process.exit(1);
        }
        return;
    }

    console.log('\n📚 Migration History:');
    let hasErrors = false;

    migrations.forEach(migration => {
        const migrationPath = path.join(migrationsDir, migration);
        const sqlFile = path.join(migrationPath, 'migration.sql');
        const metaFile = path.join(migrationPath, 'migration.toml');

        console.log(`\n🔹 Migration: ${migration}`);

        if (!fs.existsSync(sqlFile)) {
            console.warn(`⚠️ Missing SQL file in migration: ${migration}`);
            hasErrors = true;
        }

        if (!fs.existsSync(metaFile)) {
            console.warn(`⚠️ Missing metadata file in migration: ${migration}`);
            hasErrors = true;
        }

        if (fs.existsSync(sqlFile)) {
            const sql = fs.readFileSync(sqlFile, 'utf8');
            const dangerousOperations = checkDangerousOperations(sql);
            if (dangerousOperations.length > 0) {
                console.warn('⚠️ Found potentially dangerous operations:');
                dangerousOperations.forEach(op => console.warn(`  - ${op}`));
            }
        }
    });

    if (hasErrors) {
        console.log('\n🔄 Attempting to fix migration issues...');
        try {
            execSync('npx prisma migrate reset --force', { stdio: 'inherit' });
            console.log('✅ Migration reset successful');
        } catch (error) {
            console.error('❌ Failed to reset migrations:', error.message);
            process.exit(1);
        }
        return;
    }

    // 3. Verify migrations can be applied
    console.log('\n🧪 Testing migrations...');
    try {
        execSync('node scripts/test-migration.js', { stdio: 'inherit' });
        console.log('✅ Migration tests passed');
    } catch (error) {
        console.error('❌ Migration tests failed');
        process.exit(1);
    }
}

function checkDangerousOperations(sql) {
    const dangerous = [];
    
    // Check for DROP operations
    if (sql.toLowerCase().includes('drop table') || sql.toLowerCase().includes('drop column')) {
        dangerous.push('Contains DROP operations');
    }

    // Check for ALTER column type changes
    if (sql.toLowerCase().includes('alter column') && sql.toLowerCase().includes('type')) {
        dangerous.push('Contains column type changes');
    }

    // Check for RENAME operations
    if (sql.toLowerCase().includes('rename table') || sql.toLowerCase().includes('rename column')) {
        dangerous.push('Contains RENAME operations');
    }

    // Check for potential data loss
    if (sql.toLowerCase().includes('cascade')) {
        dangerous.push('Contains CASCADE operations');
    }

    return dangerous;
}

// Run the check if this file is executed directly
if (require.main === module) {
    checkMigrations().catch(error => {
        console.error('Migration check failed:', error);
        process.exit(1);
    });
} 