import "server-only";
import mysql, { type Pool, type PoolConnection, type ResultSetHeader } from "mysql2/promise";

/** Kept on globalThis so development reloads don't open a new pool each time. */
const store = globalThis as unknown as { __ogaalPool?: Pool };

export function isDbConfigured(): boolean {
  return Boolean(process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER);
}

export function pool(): Pool {
  if (!store.__ogaalPool) {
    store.__ogaalPool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME,
      connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
      charset: "utf8mb4",
      // DATE and DATETIME stay strings, so no time-zone shifting of certificate dates.
      dateStrings: true,
      // An object passed as a parameter becomes a quoted string, never SQL.
      stringifyObjects: true,
      decimalNumbers: true,
      bigNumberStrings: false,
      supportBigNumbers: true,
    });
    // All DATETIME values are stored and compared in UTC.
    (store.__ogaalPool as unknown as { pool: { on(e: "connection", cb: (c: { query(sql: string): void }) => void): void } }).pool.on("connection", (c) =>
      c.query("SET time_zone = '+00:00'"),
    );
  }
  return store.__ogaalPool;
}

type Executor = Pool | PoolConnection;

export async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = [], on: Executor = pool()): Promise<T[]> {
  const [rows] = await on.query(sql, params);
  return rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(sql: string, params: unknown[] = [], on: Executor = pool()): Promise<T | null> {
  return (await query<T>(sql, params, on))[0] ?? null;
}

export async function run(sql: string, params: unknown[] = [], on: Executor = pool()): Promise<ResultSetHeader> {
  const [res] = await on.query(sql, params);
  return res as ResultSetHeader;
}

export async function transaction<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool().getConnection();
  try {
    await conn.beginTransaction();
    const out = await fn(conn);
    await conn.commit();
    return out;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/** JSON columns arrive parsed from MySQL and as text from MariaDB. */
export function parseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function isDuplicateError(err: unknown): err is { code: string; message: string } {
  return (err as { code?: string })?.code === "ER_DUP_ENTRY";
}
