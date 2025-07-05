// examples/drizzle-stress-test/db/connections.ts
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleMysql } from 'drizzle-orm/mysql2';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { Pool } from 'pg';
import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';
import { postgresSchema } from '../schemas/postgres';
import { mysqlSchema } from '../schemas/mysql';
import { sqliteSchema } from '../schemas/sqlite';

// PostgreSQL connection
export function createPostgresConnection() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  return drizzlePg(pool, { schema: postgresSchema });
}

// MySQL connection
export async function createMysqlConnection() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'drizzle_stress_test',
  });

  return drizzleMysql(connection, { schema: mysqlSchema, mode: 'default' });
}

// SQLite connection
export function createSqliteConnection() {
  const sqlite = new Database('./examples/drizzle-stress-test/stress.db');

  return drizzleSqlite(sqlite, { schema: sqliteSchema });
}

// Factory function to get the right connection and schema
export async function createDrizzleConnection(provider: 'postgres' | 'mysql' | 'sqlite') {
  switch (provider) {
    case 'postgres':
      return {
        db: createPostgresConnection(),
        schema: postgresSchema,
      };
    case 'mysql':
      return {
        db: await createMysqlConnection(),
        schema: mysqlSchema,
      };
    case 'sqlite':
      return {
        db: createSqliteConnection(),
        schema: sqliteSchema,
      };
    default:
      throw new Error(`Unsupported database provider: ${provider}`);
  }
}