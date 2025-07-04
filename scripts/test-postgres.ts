// scripts/test-postgres.ts
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

import { Seeder } from '../src/core/seeder';
import { PostgresAdapter } from '../src/adapters/postgres-adapter';
import { Schema } from '../src/types/schema';

const PG_CONNECTION_STRING = 'postgresql://quickseed_user:123456789@localhost:5432/quickseed_db';

/**
 * A helper to reset and set up the database schema for a fresh run.
 */
async function setupTestDatabase() {
  const pool = new Pool({ connectionString: PG_CONNECTION_STRING });
  const client = await pool.connect();
  console.log('Resetting PostgreSQL database...');
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.postgres.sql'), 'utf-8');
    await client.query(schemaSql);
    console.log('PostgreSQL database and tables created successfully.');
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
    adapter: new PostgresAdapter(),
  });

  await seeder.seed(schema, PG_CONNECTION_STRING);
}

main().catch(error => {
  console.error('An error occurred in the test script:');
  console.error(error);
  process.exit(1);
});