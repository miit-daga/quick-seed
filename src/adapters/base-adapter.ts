// src/adapters/base-adapter.ts

/**
 * Defines the standard interface for all database adapters.
 * This contract ensures that the Seeder can interact with any database
 * in a consistent way.
 */
export interface IDatabaseAdapter {
    /**
     * Establishes a connection to the database.
     * @param connectionDetails - The necessary configuration to connect.
     *   For SQLite, this might be a file path. For Postgres, a connection string.
     */
    connect(connectionDetails: any): Promise<void>;
  
    /**
     * Inserts multiple records into a specified table.
     * @param tableName - The name of the table to insert data into.
     * @param data - An array of objects, where each object represents a row.
     * @returns A promise that resolves with the records that were inserted,
     *   ideally including the database-generated primary keys.
     */
    insert(tableName: string, data: any[]): Promise<any[]>;
  
    /**
     * Closes the connection to the database.
     */
    disconnect(): Promise<void>;
  }


  /**
 * ------------------------------------------------------------------------
 * Summary:
 * 
 * This interface (`IDatabaseAdapter`) defines the contract that all database
 * adapters must follow to be compatible with the Seeder system.
 * 
 * Any custom adapter (e.g., for SQLite, PostgreSQL, MongoDB, etc.) must
 * implement all three methods:
 *   - connect(): Establishes a connection using configuration details.
 *   - insert(): Inserts one or more records into a specified table.
 *   - disconnect(): Closes the connection cleanly.
 * 
 * By adhering to this interface, the `Seeder` class can remain completely
 * database-agnostic and reuse the same logic regardless of the underlying DB.
 * 
 * This makes the project modular, extensible, and easy to maintain.
 * ------------------------------------------------------------------------
 */
