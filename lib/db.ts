import { Pool, type QueryResult, type QueryResultRow } from 'pg';

let pool: Pool | null = null;

export function getDbPool(): Pool | null {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString && !process.env.PGDATABASE) {
    // Database environment variable not configured yet
    return null;
  }

  pool = new Pool({
    connectionString: connectionString || undefined,
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT) || 5432,
    database: process.env.PGDATABASE || 'fresh_farm',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err);
  });

  return pool;
}

/**
 * Executes a parameterized SQL query against PostgreSQL.
 * Parameterized queries protect against SQL Injection.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const p = getDbPool();
  if (!p) {
    throw new Error(
      'PostgreSQL is not configured. Set DATABASE_URL in your .env.local file to connect to Postgres.'
    );
  }
  const start = Date.now();
  const res = await p.query<T>(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== 'production') {
    console.log('[SQL Execution]', { text: text.trim().replace(/\s+/g, ' '), duration, rows: res.rowCount });
  }
  return res;
}
