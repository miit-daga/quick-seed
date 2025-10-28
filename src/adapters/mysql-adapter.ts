// src/adapters/mysql-adapter.ts
import mysql from 'mysql2/promise';
import { IDatabaseAdapter } from './base-adapter';

/**
 * An adapter for interacting with a MySQL database using the 'mysql2/promise' library.
 */
export class MysqlAdapter implements IDatabaseAdapter {
  private pool!: mysql.Pool;

  /**
   * Establishes a connection pool to the MySQL database.
   * @param connectionUri - The connection URI, e.g., 'mysql://user:password@host:port/database'
   */
  public async connect(connectionUri: string): Promise<void> {
    try {
      this.pool = mysql.createPool(connectionUri);
      const connection = await this.pool.getConnection();
      console.log('Successfully connected to MySQL database.');
      connection.release();
    } catch (error) {
      console.error('Failed to connect to MySQL database.');
      throw error;
    }
  }

  /**
   * Inserts multiple records into a specified table using a single bulk-insert statement.
   * Because MySQL versions older than 8.0.21 do not support `RETURNING *`, this method
   * performs a subsequent `SELECT` query within the same transaction to retrieve the
   * inserted rows, relying on the returned `insertId` and `affectedRows`.
   *
   * This implementation assumes the primary key is an auto-incrementing integer
   * named `id`.
   *
   * @param tableName - The name of the table to insert data into.
   * @param data - An array of objects representing the rows.
   * @returns A promise that resolves with the inserted records, including their new IDs.
   */
  public async insert(tableName: string, data: any[]): Promise<any[]> {
    if (data.length === 0) {
      return [];
    }

    const connection = await this.pool.getConnection();
    await connection.beginTransaction();

    try {
      const keys = Object.keys(data[0]);
      const columns = keys.map(key => `\`${key}\``).join(', ');
      
      // Prepare a single bulk insert statement.
      const insertSql = `INSERT INTO \`${tableName}\` (${columns}) VALUES ?`;
      
      // Convert array of objects to array of arrays for bulk insertion.
      const values = data.map(record => {
        return keys.map(key => {
          const value = record[key];
          if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
            return JSON.stringify(value);
          }
          return value;
        });
      });

      const [result] = await connection.query(insertSql, [values]);
      const insertResult = result as mysql.ResultSetHeader;

      if (insertResult.affectedRows !== data.length) {
        throw new Error('Mismatch between expected and actual number of inserted rows.');
      }

      const firstInsertId = insertResult.insertId;
      const [rows] = await connection.query(
        `SELECT * FROM \`${tableName}\` WHERE \`id\` >= ? LIMIT ?`,
        [firstInsertId, insertResult.affectedRows]
      );
      
      await connection.commit();
      return rows as any[];
    } catch (error) {
      await connection.rollback();
      console.error('Error during MySQL insert transaction. Rolling back.');
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Closes all connections in the pool.
   */
  public async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      console.log('MySQL connection pool closed.');
    }
  }
}