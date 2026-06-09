import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

let pool: any = null;

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is missing. Please set DATABASE_URL in your environment.");
    }
    
    const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    
    // Create the pg.Pool client with Vercel Postgres/Neon optimization parameters
    const pgPool = new Pool({
      connectionString,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 4,                        // limit connection usage per serverless function instance
      idleTimeoutMillis: 30000,      // close idle connections after 30 seconds
      connectionTimeoutMillis: 15000 // wait 15 seconds max to connect (gives Neon time to wake up)
    });

    pgPool.on('error', (err) => {
      console.error('Unexpected error on idle database client', err);
    });

    // Wrap the pool to add automatic retry logic for database queries (cold starts / network jank resilience)
    pool = {
      query: async (text: string, params?: any[]) => {
        let attempts = 3;
        while (attempts > 0) {
          try {
            return await pgPool.query(text, params);
          } catch (err: any) {
            attempts--;
            const isNetworkOrTimeout = 
              err.message.includes('timeout') || 
              err.message.includes('connect') || 
              err.code === 'ETIMEDOUT' || 
              err.code === 'ECONNREFUSED' ||
              err.message.includes('connection') ||
              err.message.includes('ssl');
            
            if (isNetworkOrTimeout && attempts > 0) {
              console.warn(`Database query failed (timeout/connection), retrying in 2s... (${attempts} attempts left). Error: ${err.message}`);
              await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
              throw err;
            }
          }
        }
        throw new Error("Database query failed after all retry attempts.");
      },
      on: (event: string, callback: (...args: any[]) => void) => {
        pgPool.on(event as any, callback);
      },
      end: () => pgPool.end()
    };
  }
  return pool;
}

export async function initDb() {
  const p = getPool();
  try {
    const schemaPath = path.join(process.cwd(), 'src', 'lib', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await p.query(schema);
    console.log("PostgreSQL database tables initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize database tables:", error);
  }
}
