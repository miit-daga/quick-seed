// src/adapters/sqlite-adapter.ts
import Database from 'better-sqlite3';
import { IDatabaseAdapter } from './base-adapter';

/**
 * An adapter for interacting with SQLite databases using better-sqlite3.
 * Handles data type conversions and bulk inserts with transactions.
 */
export class SqliteAdapter implements IDatabaseAdapter {
  private db!: Database.Database;

  public async connect(dbPath: string): Promise<void> {
    try {
      this.db = new Database(dbPath);
      console.log(`Successfully connected to SQLite database at: ${dbPath}`);
    } catch (error) {
      console.error(`Failed to connect to SQLite database at: ${dbPath}`);
      throw error;
    }
  }

  public async insert(tableName: string, data: any[]): Promise<any[]> {
    if (data.length === 0) {
      return [];
    }

    // Pre-process data to convert types not supported by better-sqlite3.
    const processedData = data.map(record => {
      const newRecord = { ...record };
      for (const key in newRecord) {
        const value = newRecord[key];
        if (value instanceof Date) {
          newRecord[key] = value.toISOString();
        } else if (typeof value === 'boolean') {
          newRecord[key] = value ? 1 : 0;
        } else if (typeof value === 'object' && value !== null) {
          newRecord[key] = JSON.stringify(value);
        }
      }
      return newRecord;
    });

    // Check if the generated data has no columns
    if (Object.keys(processedData[0]).length === 0) {
      throw new Error(
        `Cannot insert into table "${tableName}". The generated data has no columns. Please check the 'fields' configuration for this table in your schema file.`
      );
    }

    const keys = Object.keys(processedData[0]);
    const columns = keys.join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const insertSql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;

    const insertedRecords: any[] = [];
    const insertTransaction = this.db.transaction((records) => {
      const statement = this.db.prepare(insertSql);
      for (const record of records) {
        const values = keys.map(key => record[key]);
        const inserted = statement.get(values);
        insertedRecords.push(inserted);
      }
    });

    insertTransaction(processedData);
    return insertedRecords;
  }

  public async disconnect(): Promise<void> {
    this.db.close();
    console.log('SQLite connection closed.');
  }
}