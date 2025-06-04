const fs = require('fs');
const path = require('path');

console.log('🔧 Admin Connection Pool Fix Analysis\n');

// List of admin routes that need database connection fixes
const adminRoutes = [
    'src/app/api/admin/customers/route.js',
    'src/app/api/admin/employees/route.js', 
    'src/app/api/admin/services/route.js',
    'src/app/api/admin/payments/route.js',
    'src/app/api/admin/referrals/route.js',
    'src/app/api/admin/login/route.js'
];

function analyzeRoute(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        const hasAwaitPrisma = content.includes('await prisma');
        const hasPrismaDisconnect = content.includes('prisma.$disconnect');
        const hasWithDatabase = content.includes('withAdminDatabase') || content.includes('withDatabase');
        const hasTryFinally = content.includes('} finally {');
        
        return {
            exists: true,
            hasAwaitPrisma,
            hasPrismaDisconnect,
            hasWithDatabase,
            hasTryFinally,
            needsFix: hasAwaitPrisma && !hasWithDatabase && !hasPrismaDisconnect
        };
    } catch (error) {
        return {
            exists: false,
            error: error.message
        };
    }
}

console.log('📊 Analyzing admin routes for connection management issues:\n');

adminRoutes.forEach(routePath => {
    const analysis = analyzeRoute(routePath);
    const fileName = path.basename(routePath);
    
    if (!analysis.exists) {
        console.log(`❓ ${fileName}: File not found`);
        return;
    }
    
    if (analysis.needsFix) {
        console.log(`❌ ${fileName}: NEEDS FIX - Uses Prisma but no proper connection management`);
        console.log(`   - Uses await prisma: ${analysis.hasAwaitPrisma ? '✓' : '✗'}`);
        console.log(`   - Has prisma.$disconnect(): ${analysis.hasPrismaDisconnect ? '✓' : '✗'}`);
        console.log(`   - Uses withDatabase helper: ${analysis.hasWithDatabase ? '✓' : '✗'}`);
        console.log(`   - Has try/finally: ${analysis.hasTryFinally ? '✓' : '✗'}`);
    } else if (analysis.hasAwaitPrisma) {
        console.log(`✅ ${fileName}: OK - Has proper connection management`);
    } else {
        console.log(`ℹ️  ${fileName}: No Prisma usage detected`);
    }
    console.log('');
});

console.log('\n🔧 RECOMMENDED FIXES:\n');

console.log('1. Update Prisma Configuration:');
console.log('   - Increased connection pool from 5→15 (production) and 5→10 (development)');
console.log('   - Increased connection timeout from 20s→30s');
console.log('   - Added proper pool timeout and idle timeout settings');
console.log('');

console.log('2. Use withAdminDatabase() helper in all admin routes:');
console.log('   - Wrap all database operations in withAdminDatabase()');
console.log('   - This provides automatic retry logic and proper error handling');
console.log('   - Eliminates need for manual prisma.$disconnect() calls');
console.log('');

console.log('3. Pattern to implement in admin routes:');
console.log(`
   import { withAdminDatabase } from "@/lib/prisma";
   
   export async function GET(request) {
       try {
           const result = await withAdminDatabase(async (prisma) => {
               // All database operations here
               return await prisma.model.findMany(...);
           });
           
           return NextResponse.json(result);
       } catch (error) {
           if (error.code === 'P2024') {
               return NextResponse.json({ 
                   error: 'Database connection timeout' 
               }, { status: 503 });
           }
           return NextResponse.json({ error: 'Server error' }, { status: 500 });
       }
   }
`);

console.log('\n4. Priority fixes needed for:');
adminRoutes.forEach(routePath => {
    const analysis = analyzeRoute(routePath);
    if (analysis.needsFix) {
        console.log(`   - ${path.basename(routePath)}`);
    }
});

console.log('\n✅ Apply these fixes to resolve the admin dashboard connection pool timeouts.'); 