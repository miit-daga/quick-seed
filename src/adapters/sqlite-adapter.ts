// src/adapters/sqlite-adapter.ts
import Database from 'better-sqlite3';
import { IDatabaseAdapter } from './base-adapter';

/**
 * An adapter for interacting with an SQLite database.
 */
export class SqliteAdapter implements IDatabaseAdapter {
  private db!: Database.Database;

  /**
   * Establishes a connection to the SQLite database file.
   * @param dbPath - The file path to the SQLite database.
   */
  public async connect(dbPath: string): Promise<void> {
    try {
      this.db = new Database(dbPath);
      console.log(`Successfully connected to SQLite database at: ${dbPath}`);
    } catch (error) {
      console.error(`Failed to connect to SQLite database at: ${dbPath}`);
      throw error;
    }
  }

  /**
   * Inserts multiple records into a specified table.
   * returns the fully inserted records, including
   * their database-assigned primary keys.
   * @param tableName - The name of the table to insert data into.
   * @param data - An array of objects representing the rows.
   * @returns A promise that resolves with the inserted records, including IDs.
   */
  public async insert(tableName: string, data: any[]): Promise<any[]> {
    if (data.length === 0) {
      return [];
    }

    const keys = Object.keys(data[0]);
    const columns = keys.join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    // The RETURNING * clause is the key to getting the inserted rows back
    const insertSql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;

    const insertedRecords: any[] = [];

    // use a transaction for performance and data consistency.
    const insertTransaction = this.db.transaction((records) => {
      const statement = this.db.prepare(insertSql);
      for (const record of records) {
        const values = keys.map(key => record[key]);
        // .get() executes the statement and returns the first row.
        // Since using RETURNING *, it returns the complete inserted row.
        const inserted = statement.get(values);
        insertedRecords.push(inserted);
      }
    });

    insertTransaction(data);
    return insertedRecords;
  }

  /**
   * Closes the connection to the database.
   */
  public async disconnect(): Promise<void> {
    this.db.close();
    console.log('SQLite connection closed.');
  }
}



/**
 * ------------------------------------------------------------------------
 * Summary:
 *
 * This file defines the `SqliteAdapter` class, which implements the
 * `IDatabaseAdapter` interface for interacting with SQLite databases using
 * the fast and synchronous `better-sqlite3` library.
 * 
 * Enhancements in This Version:
 * - The `insert()` method now uses `RETURNING *` to return the full inserted
 *   records — including auto-generated primary keys (like `id`). This is critical
 *   for enabling foreign key resolution in downstream tables during seeding.
 * 
 * Key Functionalities:
 * 1. `connect(dbPath)`: Opens a SQLite connection using the file path.
 * 2. `insert(tableName, data)`: Performs bulk inserts within a transaction.
 *    - Dynamically builds the insert statement using the fields from data.
 *    - Uses `.get()` on each insert to capture the returned inserted row.
 *    - Returns all inserted records, with IDs.
 * 3. `disconnect()`: Gracefully closes the SQLite connection.
 *
 * Notes:
 * - The `db!` property is asserted to be initialized in `connect()` before use.
 * - The use of `RETURNING *` is supported in modern SQLite (3.35+).
 * - Transactions improve performance and prevent partial inserts.
 *
 * This adapter is fully compatible with the `Seeder` engine and supports
 * foreign key resolution workflows by returning inserted rows.
 * ------------------------------------------------------------------------
 */
