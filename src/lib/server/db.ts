import { Pool, type PoolClient, type QueryResultRow } from 'pg';

const globalForDb = globalThis as unknown as { kbPool?: Pool };

export function getPool(): Pool {
  if (!globalForDb.kbPool) {
    const connectionString = (process.env.DATABASE_URL || '').trim();
    if (!connectionString) throw new Error('DATABASE_URL não definida.');
    globalForDb.kbPool = new Pool({ connectionString });
  }
  return globalForDb.kbPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const resultado = await getPool().query<T>(sql, params);
  return resultado.rows;
}

export async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const resultado = await fn(client);
    await client.query('COMMIT');
    return resultado;
  } catch (erro) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw erro;
  } finally {
    client.release();
  }
}
