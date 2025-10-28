import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { detectORM, getORMConnectionInfo, ORMInfo } from '../utils/orm-detection';

const CONFIG_FILE_NAME = 'quick-seed.config.js';

module.exports = {
  command: 'init',
  describe: 'Create a quick-seed.config.js file with your database connection details.',

  handler: async () => {
    const configPath = path.join(process.cwd(), CONFIG_FILE_NAME);

    if (fs.existsSync(configPath)) {
      console.warn(`A '${CONFIG_FILE_NAME}' file already exists in this directory. Aborting.`);
      return;
    }

    try {
      // Detect ORM setup
      const ormInfo = detectORM();

      // Build database choices
      const dbChoices = [];

      if (ormInfo.type === 'prisma') {
        dbChoices.push({
          name: '🟣 Prisma ORM (Auto-detected)',
          value: 'prisma'
        });
      }

      if (ormInfo.type === 'drizzle') {
        dbChoices.push({
          name: '🟠 Drizzle ORM (Auto-detected)',
          value: 'drizzle'
        });
      }

      // Add manual options
      dbChoices.push(
        new inquirer.Separator(),
        { name: '🐘 PostgreSQL', value: 'postgres' },
        { name: '🦭 MySQL / MariaDB', value: 'mysql' },
        { name: '📁 SQLite (file-based)', value: 'sqlite' }
      );

      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'adapter',
          message: 'Which database or ORM will you be using?',
          choices: dbChoices,
        },
        {
          type: 'input',
          name: 'connection',
          message: (answers: any) => {
            switch (answers.adapter) {
              case 'prisma':
                return 'Prisma setup detected! Press Enter to use your existing Prisma configuration:';
              case 'drizzle':
                return 'Drizzle setup detected! Press Enter to use your existing Drizzle configuration:';
              case 'postgres':
                return 'Enter PostgreSQL connection string (e.g., postgresql://user:pass@localhost:5432/db):';
              case 'mysql':
                return 'Enter MySQL connection string (e.g., mysql://user:pass@localhost:3306/db):';
              case 'sqlite':
                return 'Enter SQLite database file path (e.g., ./database.db):';
              default:
                return 'Enter connection string:';
            }
          },
          default: (answers: any) => {
            if (answers.adapter === 'prisma' || answers.adapter === 'drizzle') {
              return 'auto'; // Special marker for auto-config
            }
            return '';
          },
          validate: (input: string, answers: any) => {
            if ((answers.adapter === 'prisma' || answers.adapter === 'drizzle') && input === 'auto') {
              return true; // Allow auto for ORMs
            }
            if (!input.trim()) {
              return 'Connection string cannot be empty.';
            }
            return true;
          },
        },
      ] as any);

      let configContent: string;

      if (answers.adapter === 'prisma' && ormInfo.type === 'prisma') {
        // Generate Prisma config
        configContent = `// quick-seed configuration file for Prisma
const { PrismaClient } = require('@prisma/client');
const { PrismaAdapter } = require('quick-seed/dist/adapters/prisma-adapter');

const prisma = new PrismaClient();

module.exports = {
  adapter: new PrismaAdapter(),
  connection: prisma,
};
`;
      } else if (answers.adapter === 'drizzle' && ormInfo.type === 'drizzle') {
        // Generate Drizzle config
        configContent = `// quick-seed configuration file for Drizzle
const { DrizzleAdapter } = require('quick-seed/dist/adapters/drizzle-adapter');
const { createDrizzleConnection } = require('./db/connections');

// Choose database provider (you can set DB_PROVIDER env var or change this)
const provider = process.env.DB_PROVIDER || 'sqlite';

module.exports = {
  adapter: new DrizzleAdapter(),
  connection: async () => {
    const { db, schema } = await createDrizzleConnection(provider);
    return { db, schema };
  },
};
`;
      } else {
        // Generate regular SQL config
        configContent = `// quick-seed configuration file
module.exports = {
  adapter: '${answers.adapter}',
  connection: '${answers.connection}',
};
`;
      }

      fs.writeFileSync(configPath, configContent);

      if (answers.adapter === 'prisma' || answers.adapter === 'drizzle') {
        console.log(`✅ Success! Configuration file created for ${answers.adapter.toUpperCase()} ORM at: ${configPath}`);
        console.log('   Note: You may need to adjust import paths in the config file.');
        console.log('   Then run: quick-seed seed --schema your-schema.json');
      } else {
        console.log(`✅ Success! Configuration file created at: ${configPath}`);
        console.log('   You can now create schema files and run: quick-seed seed --schema your-schema.json');
      }

    } catch (error) {
      console.error('❌ Error creating configuration file:', error);
      process.exit(1);
    }
  },
};