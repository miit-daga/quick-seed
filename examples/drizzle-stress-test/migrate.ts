// examples/drizzle-stress-test/migrate.ts
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleMysql } from 'drizzle-orm/mysql2';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator';
import { migrate as migrateMysql } from 'drizzle-orm/mysql2/migrator';
import { migrate as migrateSqlite } from 'drizzle-orm/better-sqlite3/migrator';
import { Pool } from 'pg';
import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';
import { sql } from 'drizzle-orm';
import { createDrizzleConnection } from './db/connections';

async function runMigrations(provider: 'postgres' | 'mysql' | 'sqlite') {
  console.log(`Running migrations for ${provider}...`);
  
  try {
    const { db } = await createDrizzleConnection(provider);
    
    // Drop and recreate tables manually since we don't have drizzle-kit setup
    await dropAndCreateTables(db as any, provider);
    
    console.log(`${provider} migrations completed successfully.`);
  } catch (error) {
    console.error(`Error running ${provider} migrations:`, error);
    throw error;
  }
}

async function dropAndCreateTables(db: any, provider: string) {
  console.log(`Dropping and recreating tables for ${provider}...`);
  
  switch (provider) {
    case 'postgres':
      await db.execute(sql`DROP TABLE IF EXISTS tasks CASCADE`);
      await db.execute(sql`DROP TABLE IF EXISTS projects CASCADE`);
      await db.execute(sql`DROP TABLE IF EXISTS users CASCADE`);
      await db.execute(sql`DROP TABLE IF EXISTS organizations CASCADE`);
      
      await db.execute(sql`
        CREATE TABLE organizations (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE
        )
      `);
      
      await db.execute(sql`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          full_name TEXT NOT NULL
        )
      `);
      
      await db.execute(sql`
        CREATE TABLE projects (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          organization_id INTEGER NOT NULL REFERENCES organizations(id)
        )
      `);
      
      await db.execute(sql`
        CREATE TABLE tasks (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          project_id INTEGER NOT NULL REFERENCES projects(id),
          assignee_id INTEGER REFERENCES users(id),
          parent_task_id INTEGER REFERENCES tasks(id),
          metadata JSONB
        )
      `);
      break;
      
    case 'mysql':
      await db.execute(sql`DROP TABLE IF EXISTS tasks`);
      await db.execute(sql`DROP TABLE IF EXISTS projects`);
      await db.execute(sql`DROP TABLE IF EXISTS users`);
      await db.execute(sql`DROP TABLE IF EXISTS organizations`);
      
      await db.execute(sql`
        CREATE TABLE organizations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE
        )
      `);
      
      await db.execute(sql`
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          full_name VARCHAR(255) NOT NULL
        )
      `);
      
      await db.execute(sql`
        CREATE TABLE projects (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          organization_id INT NOT NULL,
          FOREIGN KEY (organization_id) REFERENCES organizations(id)
        )
      `);
      
      await db.execute(sql`
        CREATE TABLE tasks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          project_id INT NOT NULL,
          assignee_id INT,
          parent_task_id INT,
          metadata JSON,
          FOREIGN KEY (project_id) REFERENCES projects(id),
          FOREIGN KEY (assignee_id) REFERENCES users(id),
          FOREIGN KEY (parent_task_id) REFERENCES tasks(id)
        )
      `);
      break;
      
    case 'sqlite':
      await db.execute(sql`DROP TABLE IF EXISTS tasks`);
      await db.execute(sql`DROP TABLE IF EXISTS projects`);
      await db.execute(sql`DROP TABLE IF EXISTS users`);
      await db.execute(sql`DROP TABLE IF EXISTS organizations`);
      
      await db.execute(sql`
        CREATE TABLE organizations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE
        )
      `);
      
      await db.execute(sql`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL UNIQUE,
          full_name TEXT NOT NULL
        )
      `);
      
      await db.execute(sql`
        CREATE TABLE projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          organization_id INTEGER NOT NULL,
          FOREIGN KEY (organization_id) REFERENCES organizations(id)
        )
      `);
      
      await db.execute(sql`
        CREATE TABLE tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          project_id INTEGER NOT NULL,
          assignee_id INTEGER,
          parent_task_id INTEGER,
          metadata TEXT,
          FOREIGN KEY (project_id) REFERENCES projects(id),
          FOREIGN KEY (assignee_id) REFERENCES users(id),
          FOREIGN KEY (parent_task_id) REFERENCES tasks(id)
        )
      `);
      break;
  }
}

async function main() {
  const provider = (process.env.DB_PROVIDER as 'postgres' | 'mysql' | 'sqlite') || 'sqlite';
  
  try {
    await runMigrations(provider);
    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}