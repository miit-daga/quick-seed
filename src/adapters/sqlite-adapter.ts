// src/adapters/sqlite-adapter.ts
import Database from 'better-sqlite3';
import { IDatabaseAdapter } from './base-adapter';

/**
 * An adapter for interacting with an SQLite database.
 * It handles data sanitization for types not natively supported by the driver.
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


/**
 * ------------------------------------------------------------------------
 * Summary:
 *
 * The `MysqlAdapter` implements the `IDatabaseAdapter` interface for
 * interacting with MySQL databases using the `mysql2/promise` library.
 *
 * Key Functionalities:
 * 1. `connect(connectionUri)`: Establishes a connection pool to the MySQL database.
 *    Verifies connectivity by acquiring and releasing a test connection.
 *
 * 2. `insert(tableName, data)`: Inserts multiple records using a single bulk insert.
 *    - Uses parameterized queries and a multi-row `VALUES ?` syntax.
 *    - Because MySQL (prior to 8.0.21) doesn't support `RETURNING *`, the adapter:
 *      - Retrieves the `insertId` and `affectedRows` from the result.
 *      - Executes a `SELECT * WHERE id >= ? LIMIT ?` query to fetch inserted rows.
 *    - Assumes `id` is the auto-increment primary key (standard convention).
 *    - Performs all operations inside a transaction for atomicity.
 *
 * 3. `disconnect()`: Closes the connection pool cleanly.
 *
 * Design Considerations:
 * - Assumes table names and column names are safe to wrap with backticks (`` ` ``).
 * - `insert()` is compatible with foreign key resolution thanks to returned inserted rows.
 * - Safer than naive `SELECT MAX(id)` approaches — avoids race conditions.
 *
 * This adapter ensures efficient and reliable MySQL compatibility for the seeder
 * engine and aligns with the PostgreSQL and SQLite adapters for consistent behavior.
 * ------------------------------------------------------------------------
 */
