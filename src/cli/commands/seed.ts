import fs from 'fs';
import path from 'path';
import cliProgress from 'cli-progress';
import { Seeder, ProgressCallback } from '../../core/seeder';
import { SqliteAdapter } from '../../adapters/sqlite-adapter';
import { PostgresAdapter } from '../../adapters/postgres-adapter';
import { MysqlAdapter } from '../../adapters/mysql-adapter';
import { PrismaAdapter } from '../../adapters/prisma-adapter';
import { DrizzleAdapter } from '../../adapters/drizzle-adapter';

const CONFIG_FILE_NAME = 'quick-seed.config.js';

function getAdapter(adapterName: string) {
  switch (adapterName) {
    case 'sqlite':
      return new SqliteAdapter();
    case 'postgres':
      return new PostgresAdapter();
    case 'mysql':
      return new MysqlAdapter();
    case 'prisma':
      return new PrismaAdapter();
    case 'drizzle':
      return new DrizzleAdapter();
    default:
      throw new Error(`Unknown adapter: ${adapterName}. Supported: sqlite, postgres, mysql, prisma, drizzle`);
  }
}

function loadSchemaFile(filePath: string) {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Schema file not found: ${fullPath}`);
  }

  try {
    if (fullPath.endsWith('.json')) {
      return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
    } else if (fullPath.endsWith('.js')) {
      return require(fullPath);
    } else {
      throw new Error('Schema file must be .json or .js');
    }
  } catch (error) {
    throw new Error(`Failed to load schema file ${fullPath}: ${(error as Error).message}`);
  }
}

module.exports = {
  command: 'seed',
  describe: 'Seed the database using schema files and configuration.',

  builder: (yargs: any) => {
    return yargs
      .option('schema', {
        alias: 's',
        type: 'array',
        describe: 'Path(s) to schema file(s) (JSON or JS)',
        demandOption: true,
      })
      .option('config', {
        alias: 'c',
        type: 'string',
        describe: 'Path to config file (default: quick-seed.config.js)',
        default: CONFIG_FILE_NAME,
      });
  },

  handler: async (argv: any) => {
    console.log('🌱 Starting the seeding process...');
    const startTime = Date.now();

    // Create progress bars
    const multibar = new cliProgress.MultiBar({
      clearOnComplete: false,
      hideCursor: true,
      format: '{bar} {percentage}% | {value}/{total} | {eta_formatted} | {message}'
    });

    let overallBar: cliProgress.SingleBar;
    let tableBar: cliProgress.SingleBar;
    let totalTables = 0;
    let totalRecords = 0;
    let tablesCompleted = 0;

    const progressCallback: ProgressCallback = (event) => {
      switch (event.phase) {
        case 'starting':
          totalTables = event.totalTables || 0;
          totalRecords = event.totalRecords || 0;
          
          overallBar = multibar.create(totalTables, 0, {
            message: 'Tables completed'
          });
          
          tableBar = multibar.create(totalRecords, 0, {
            message: 'Records processed'
          });
          break;

        case 'table_start':
          // Update message for current table
          if (tableBar) {
            tableBar.update(0, { message: `Processing ${event.table}` });
          }
          break;

        case 'generating':
          // Update table progress with generated records
          if (tableBar && event.recordsGenerated) {
            tableBar.increment(event.recordsGenerated);
          }
          break;

        case 'inserting':
          // Records are already counted in generating phase
          if (tableBar) {
            tableBar.update(tableBar.getTotal(), { message: `Inserted ${event.table}` });
          }
          break;

        case 'table_complete':
          tablesCompleted = event.tableIndex || 0;
          if (overallBar) {
            overallBar.update(tablesCompleted, { message: `Completed ${event.table}` });
          }
          break;

        case 'complete':
          if (overallBar && tableBar) {
            overallBar.update(totalTables);
            tableBar.update(totalRecords);
            multibar.stop();
          }
          break;
      }
    };

    try {
      // Load config
      const configPath = path.resolve(argv.config);
      if (!fs.existsSync(configPath)) {
        console.error(`❌ Config file not found: ${configPath}`);
        console.error('   Run "quick-seed init" first to create a config file.');
        process.exit(1);
      }

      const config = require(configPath);
      if (!config.adapter || !config.connection) {
        throw new Error('Config file must have "adapter" and "connection" properties.');
      }

      // Handle both string adapter names and adapter instances (for ORMs)
      let adapter;
      if (typeof config.adapter === 'string') {
        adapter = getAdapter(config.adapter);
      } else {
        // ORM config has adapter instance
        adapter = config.adapter;
      }

      // Load and merge schemas
      let mergedSchema: any = {};
      for (const schemaPath of argv.schema) {
        const schema = loadSchemaFile(schemaPath);
        mergedSchema = { ...mergedSchema, ...schema };
      }

      if (Object.keys(mergedSchema).length === 0) {
        throw new Error('No tables found in schema files.');
      }

      // Handle connection - it might be a function for Drizzle
      let connection = config.connection;
      if (typeof config.connection === 'function') {
        connection = await config.connection();
      }

      // Create seeder with progress callback and run
      const seeder = new Seeder({ adapter, progressCallback });
      await seeder.seed(mergedSchema, connection);

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      console.log(`\n✅ Seeding completed successfully in ${duration}s!`);

    } catch (error) {
      // Stop progress bars on error
      if (multibar) {
        multibar.stop();
      }
      console.error('\n❌ An error occurred during seeding:');
      console.error((error as Error).message);
      process.exit(1);
    }
  },
};