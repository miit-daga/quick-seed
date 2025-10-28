// src/adapters/postgres-adapter.ts
import { Pool, PoolClient } from 'pg';
import { IDatabaseAdapter } from './base-adapter';

/**
 * An adapter for interacting with a PostgreSQL database using the 'pg' library.
 */
export class PostgresAdapter implements IDatabaseAdapter {
  private pool!: Pool;

  /**
   * Establishes a connection pool to the PostgreSQL database.
   * @param connectionString - The connection string, e.g., 'postgresql://user:password@host:port/database'
   */
  public async connect(connectionString: string): Promise<void> {
    try {
      this.pool = new Pool({ connectionString });
      // Test the connection by getting a client from the pool
      const client = await this.pool.connect();
      console.log('Successfully connected to PostgreSQL database.');
      client.release();
    } catch (error) {
      console.error('Failed to connect to PostgreSQL database.');
      throw error;
    }
  }

  /**
   * Inserts multiple records into a specified table using a single, efficient,
   * multi-row INSERT statement within a transaction.
   * @param tableName - The name of the table to insert data into.
   * @param data - An array of objects representing the rows.
   * @returns A promise that resolves with the inserted records, including IDs.
   */
  public async insert(tableName: string, data: any[]): Promise<any[]> {
    if (data.length === 0) {
      return [];
    }

    const keys = Object.keys(data[0]);
    const columns = keys.map(key => `"${key}"`).join(', ');

    // Create placeholders for all values in a single query, e.g., ($1, $2), ($3, $4), ...
    const valuePlaceholders = data.map((_, rowIndex) => {
        const rowPlaceholders = keys.map((__, colIndex) => `$${rowIndex * keys.length + colIndex + 1}`);
        return `(${rowPlaceholders.join(', ')})`;
      }).join(', ');
      
    // Flatten all values from the data objects into a single array.
    const allValues = data.flatMap(record => keys.map(key => record[key]));
    
    const insertSql = `INSERT INTO "${tableName}" (${columns}) VALUES ${valuePlaceholders} RETURNING *`;

    // Use a single client for the transaction.
    const client: PoolClient = await this.pool.connect();
    try {
      const result = await client.query(insertSql, allValues);
      return result.rows;
    } catch (error) {
      console.error(`Error during PostgreSQL bulk insert.`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Closes all connections in the pool.
   */
  public async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      console.log('PostgreSQL connection pool closed.');
    }
  }
}
