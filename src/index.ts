// src/index.ts
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

import { Seeder } from './core/seeder';
import { SqliteAdapter } from './adapters/sqlite-adapter';
import { Schema } from './types/schema';

// Define the path for the test database
const DB_PATH = path.join(__dirname, '../db/test.db');

/**
 * A helper function to set up a fresh database for test run.
 * It deletes the old db file, creates the tables, and returns the path.
 */
function setupTestDatabase(): string {
  // Delete the old database file if it exists
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log('Removed old database file.');
  }

  // Create a new database and execute the schema SQL
  const db = new Database(DB_PATH);
  const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf-8');
  db.exec(schemaSql);
  db.close();
  console.log('Database and tables created successfully.');
  return DB_PATH;
}

// Main execution function
async function main() {
  // 1. Set up a clean database environment
  const dbConnectionPath = setupTestDatabase();

  // 2. Define the data schema
  const schema: Schema = {
    users: {
      count: 5,
      fields: {
        fullName: 'person.fullName',
        email: 'internet.email',
        createdAt: 'date.past',
      },
    },
    posts: {
      count: 10,
      fields: {
        title: 'lorem.sentence',
        content: 'lorem.paragraph',
        // This reference will be resolved by the seeder to a valid user's id.
        userId: { references: 'users.id' },
        published: 'datatype.boolean',
      },
    },
  };

  // 3. Create an instance of the seeder
  const seeder = new Seeder({
    adapter: new SqliteAdapter(), //provide a concrete adapter instance
  });

  // 4. Run the seeder.
  await seeder.seed(schema, dbConnectionPath);
}

// Execute the main function
main().catch(console.error);
