"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPostgresConnection = createPostgresConnection;
exports.createMysqlConnection = createMysqlConnection;
exports.createSqliteConnection = createSqliteConnection;
exports.createDrizzleConnection = createDrizzleConnection;
// examples/drizzle-stress-test/db/connections.ts
const node_postgres_1 = require("drizzle-orm/node-postgres");
const mysql2_1 = require("drizzle-orm/mysql2");
const better_sqlite3_1 = require("drizzle-orm/better-sqlite3");
const pg_1 = require("pg");
const promise_1 = require("mysql2/promise");
const better_sqlite3_2 = require("better-sqlite3");
const postgres_1 = require("../schemas/postgres");
const mysql_1 = require("../schemas/mysql");
const sqlite_1 = require("../schemas/sqlite");
// PostgreSQL connection
function createPostgresConnection() {
    const pool = new pg_1.Pool({
        connectionString: process.env.DATABASE_URL,
    });
    return (0, node_postgres_1.drizzle)(pool, { schema: postgres_1.postgresSchema });
}
// MySQL connection
async function createMysqlConnection() {
    const connection = await promise_1.default.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'drizzle_stress_test',
    });
    return (0, mysql2_1.drizzle)(connection, { schema: mysql_1.mysqlSchema, mode: 'default' });
}
// SQLite connection
function createSqliteConnection() {
    const Database = better_sqlite3_2;
    const sqlite = new Database('./stress.db');
    return (0, better_sqlite3_1.drizzle)(sqlite, { schema: sqlite_1.sqliteSchema });
}
// Factory function to get the right connection and schema
async function createDrizzleConnection(provider) {
    switch (provider) {
        case 'postgres':
            return {
                db: createPostgresConnection(),
                schema: postgres_1.postgresSchema,
            };
        case 'mysql':
            return {
                db: await createMysqlConnection(),
                schema: mysql_1.mysqlSchema,
            };
        case 'sqlite':
            return {
                db: createSqliteConnection(),
                schema: sqlite_1.sqliteSchema,
            };
        default:
            throw new Error(`Unsupported database provider: ${provider}`);
    }
}
