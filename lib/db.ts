import { Pool, type PoolConfig } from 'pg';

const globalForDb = globalThis as unknown as { postgresPool?: Pool };
const url = process.env.DATABASE_URL;

const config: PoolConfig = url
  ? {
      connectionString: url, // Hosted Postgres (Neon); SSL settings come from the URL.
      max: 5,
      connectionTimeoutMillis: 5000,
    }
  : {
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT ?? 5432),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      max: 10,
      connectionTimeoutMillis: 5000,
    };

export const pool = globalForDb.postgresPool ?? new Pool(config);
if (process.env.NODE_ENV !== 'production') globalForDb.postgresPool = pool;
