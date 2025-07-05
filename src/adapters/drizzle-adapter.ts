// src/adapters/drizzle-adapter.ts
import { AnyColumn, desc, gt, notInArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { PgTable } from 'drizzle-orm/pg-core';
import { MySqlTable } from 'drizzle-orm/mysql-core';
import { SQLiteTable } from 'drizzle-orm/sqlite-core';
import { IDatabaseAdapter } from './base-adapter';

type DrizzleSchema = Record<string, PgTable | MySqlTable | SQLiteTable>;
type AnyDrizzleDB = NodePgDatabase<any> | MySql2Database<any> | BetterSQLite3Database<any>;

function isPg(db: AnyDrizzleDB): db is NodePgDatabase<any> {
  return 'dialect' in db && (db as any).dialect.constructor.name === 'PgDialect';
}

function isMySql(db: AnyDrizzleDB): db is MySql2Database<any> {
  return 'dialect' in db && (db as any).dialect.constructor.name === 'MySqlDialect';
}

function isSqlite(db: AnyDrizzleDB): db is BetterSQLite3Database<any> {
  return 'dialect' in db && (db as any).dialect.constructor.name === 'SQLiteSyncDialect';
}

export class DrizzleAdapter implements IDatabaseAdapter {
  private db!: AnyDrizzleDB;
  private schema!: DrizzleSchema;

  public async connect(drizzleDetails: { db: AnyDrizzleDB; schema: DrizzleSchema }): Promise<void> {
    this.db = drizzleDetails.db;
    this.schema = drizzleDetails.schema;
    console.log('Drizzle ORM client connected.');
  }

  public async insert(
    tableName: string,
    data: any[],
    options: { pk?: string; strategy?: 'sequential' | 'lookup' } = {}
  ): Promise<any[]> {
    if (data.length === 0) return [];


    const processedData = data.map(record => {
      const newRecord = { ...record };
      for (const key in newRecord) {
        const value = newRecord[key];
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          if (isSqlite(this.db) || isMySql(this.db)) {
            newRecord[key] = JSON.stringify(value);
          }
        }
      }
      return newRecord;
    });

    const table = this.schema[tableName];
    if (!table) throw new Error(`Table "${tableName}" not found in Drizzle schema.`);

    if (isPg(this.db)) {
      const pgTable = table as PgTable;
      return await this.db.insert(pgTable).values(data).returning();
    }

    if (isSqlite(this.db)) {
      const sqliteTable = table as SQLiteTable;
      return await this.db.insert(sqliteTable).values(processedData).returning();
    }

    if (isMySql(this.db)) {
      const { pk = 'id', strategy = 'sequential' } = options;
      const mysqlTable = table as MySqlTable;
      const primaryKeyColumn = (mysqlTable as any)[pk];
      if (!primaryKeyColumn) {
        throw new Error(`Primary key column "${pk}" not found in table "${tableName}"`);
      }

      return await this.db.transaction(async (tx) => {
        if (strategy === 'sequential') {
          const [lastRecord] = await tx
            .select({ id: primaryKeyColumn })
            .from(mysqlTable)
            .orderBy(desc(primaryKeyColumn))
            .limit(1);

          const lastId = lastRecord?.id ?? null;
          await tx.insert(mysqlTable).values(processedData);

          if (lastId !== null) {
            return await tx.select().from(mysqlTable).where(gt(primaryKeyColumn, lastId));
          }
          return await tx.select().from(mysqlTable);
        } else {
          const existingRecords = await tx
            .select({ id: primaryKeyColumn })
            .from(mysqlTable);
          const existingIds = existingRecords.map(r => r.id);
          await tx.insert(mysqlTable).values(processedData);

          if (existingIds.length > 0) {
            return await tx.select().from(mysqlTable).where(notInArray(primaryKeyColumn, existingIds));
          }
          return await tx.select().from(mysqlTable);
        }
      });
    }

    throw new Error('Unsupported Drizzle database type.');
  }

  public async disconnect(): Promise<void> {
    if ('pool' in this.db && typeof (this.db as any).pool.end === 'function') {
      await (this.db as any).pool.end();  // For MySQL2
      console.log('Drizzle ORM connection closed via pool.end().');
    } else {
      console.log('Drizzle ORM connection state is managed by the underlying driver.');
    }
  }
}
