// scripts/stress-test.ts
import { Seeder } from '../src/core/seeder';
import { Schema } from '../src/types/schema';
import { IDatabaseAdapter } from '../src/adapters/base-adapter';

// Import all our adapters
import { SqliteAdapter } from '../src/adapters/sqlite-adapter';
import { PostgresAdapter } from '../src/adapters/postgres-adapter';
import { MysqlAdapter } from '../src/adapters/mysql-adapter';

// Import DB setup helpers from our other scripts
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { Pool } from 'pg';
import mysql from 'mysql2/promise';


// --- The Stress Test Schema ---
const stressTestSchema: Schema = {
  organizations: {
    count: 5,
    fields: {
      name: 'company.name',
      subscription_level: (faker) => faker.helpers.arrayElement(['free', 'pro', 'enterprise']),
    },
  },
  users: {
    count: 20,
    fields: {
      email: 'internet.email',
      full_name: 'person.fullName',
      organization_id: { references: 'organizations.id' },
    },
  },
  projects: {
    count: 15,
    fields: {
      project_name: 'commerce.productName',
      budget: (faker) => faker.finance.amount(1000, 50000, 2),
      is_active: 'datatype.boolean',
      owner_id: { references: 'users.id' },
    },
  },
  tasks: {
    count: 100,
    fields: {
      title: 'lorem.sentence',
      description: 'lorem.paragraph',
      status: (faker) => faker.helpers.arrayElement(['todo', 'in-progress', 'done']),
      project_id: { references: 'projects.id' },
      // Nullable FK: 70% chance of having an assignee
      assignee_id: (faker, db) => {
        if (Math.random() > 0.3) {
          const users = db.users || [];
          return users.length > 0 ? faker.helpers.arrayElement(users).id : null;
        }
        return null;
      },
      // Self-referencing FK: 20% chance of being a sub-task
      parent_task_id: (faker, db) => {
        if (Math.random() > 0.8) {
          const tasks = db.tasks || [];
          return tasks.length > 0 ? faker.helpers.arrayElement(tasks).id : null;
        }
        return null;
      },
      // JSON data: requires special handling per database
      metadata: (faker) => {
        const data = {
          priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
          created_by_script: true,
          uuid: faker.string.uuid(),
        };
        return data;
      },
    },
  },
};

// --- Test Runner Logic ---
async function runStressTest(
  adapterName: 'sqlite' | 'postgres' | 'mysql',
  adapter: IDatabaseAdapter,
  dbConnection: any,
  schemaPath: string
) {
  console.log(`\n--- RUNNING STRESS TEST FOR: ${adapterName.toUpperCase()} ---`);

  // 1. Setup Database
  if (adapterName === 'sqlite') {
    if (fs.existsSync(dbConnection)) fs.unlinkSync(dbConnection);
    const db = new Database(dbConnection);
    db.exec(fs.readFileSync(schemaPath, 'utf-8'));
    db.close();
  } else if (adapterName === 'postgres') {
    const pool = new Pool({ connectionString: dbConnection });
    const client = await pool.connect();
    await client.query(fs.readFileSync(schemaPath, 'utf-8'));
    client.release();
    await pool.end();
  } else if (adapterName === 'mysql') {
    const pool = mysql.createPool({ uri: dbConnection, multipleStatements: true });
    const client = await pool.getConnection();
    await client.query(fs.readFileSync(schemaPath, 'utf-8'));
    client.release();
    await pool.end();
  }
  console.log(`Database for ${adapterName} reset successfully.`);

  // 2. Run Seeder
  const seeder = new Seeder({ adapter });
  await seeder.seed(stressTestSchema, dbConnection);
}

async function main() {
  // SQLite Test
  await runStressTest(
    'sqlite',
    new SqliteAdapter(),
    path.join(__dirname, '../db/stress-test.db'),
    path.join(__dirname, '../db/stress-test.sqlite.sql')
  );

  // PostgreSQL Test
  await runStressTest(
    'postgres',
    new PostgresAdapter(),
    'postgresql://quickseed_user:123456789@localhost:5432/quickseed_db',
    path.join(__dirname, '../db/stress-test.postgres.sql')
  );

  // MySQL Test
  await runStressTest(
    'mysql',
    new MysqlAdapter(),
    'mysql://root:123456789@localhost:3306/quickseed_test',
    path.join(__dirname, '../db/stress-test.mysql.sql')
  );

  console.log("\n--- ALL STRESS TESTS COMPLETED ---");
}

main().catch(error => {
  console.error("\n--- A STRESS TEST FAILED ---");
  console.error(error);
  process.exit(1);
});