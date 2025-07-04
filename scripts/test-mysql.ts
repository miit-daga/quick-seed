// scripts/test-mysql.ts
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

import { Seeder } from '../src/core/seeder';
import { MysqlAdapter } from '../src/adapters/mysql-adapter';
import { Schema } from '../src/types/schema';


const MYSQL_CONNECTION_URI = 'mysql://root:123456789@localhost:3306/quickseed_test';

/**
 * A helper to reset and set up the database schema for a fresh run.
 */
async function setupTestDatabase() {
  const pool = mysql.createPool({
    uri: MYSQL_CONNECTION_URI,
    multipleStatements: true, 
  });
  const client = await pool.getConnection();
  console.log('Resetting MySQL database...');
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.mysql.sql'), 'utf-8');
    await client.query(schemaSql);
    console.log('MySQL database and tables created successfully.');
  } finally {
    client.release();
    await pool.end();
  }
}

async function main() {
  await setupTestDatabase();

  const schema: Schema = {
    users: {
      count: 5,
      fields: {
        full_name: 'person.fullName',
        email: 'internet.email',
        created_at: 'date.past',
      },
    },
    posts: {
      count: 10,
      fields: {
        title: 'lorem.sentence',
        content: 'lorem.paragraph',
        user_id: { references: 'users.id' },
        published: 'datatype.boolean',
      },
    },
  };

  const seeder = new Seeder({
    adapter: new MysqlAdapter(),
  });

  await seeder.seed(schema, MYSQL_CONNECTION_URI);
}

main().catch(error => {
  console.error('An error occurred in the test script:');
  console.error(error);
  process.exit(1);
});