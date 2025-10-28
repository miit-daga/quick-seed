// src/adapters/base-adapter.ts

/**
 * Defines the standard interface for all database adapters.
 * Ensures consistent interaction with any database type.
 */
export interface IDatabaseAdapter {
    /**
     * Establishes a connection to the database.
     * @param connectionDetails - Connection config (file path for SQLite, connection string for others)
     */
    connect(connectionDetails: any): Promise<void>;

    /**
     * Inserts multiple records into a table.
     * @param tableName - Target table name
     * @param data - Array of record objects to insert
     * @returns Promise resolving to inserted records (with generated IDs when possible)
     */
    insert(tableName: string, data: any[]): Promise<any[]>;

    /**
     * Closes the database connection.
     */
    disconnect(): Promise<void>;
  }
