import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';

// Create a connection pool for direct SQL queries
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Export a function to get a client from the pool
export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

// Export a function to run a query
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const client = await getClient();
  try {
    const res = await client.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } finally {
    client.release();
  }
};

// Export the pool for direct access if needed
export { pool }; 