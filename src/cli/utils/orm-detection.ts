import fs from 'fs';
import path from 'path';

export interface ORMInfo {
  type: 'prisma' | 'drizzle' | null;
  schemaPath?: string;
  configPath?: string;
  hasClient?: boolean;
}

/**
 * Detects if the current project uses Prisma or Drizzle ORM
 */
export function detectORM(projectRoot: string = process.cwd()): ORMInfo {
  // Check for Prisma - look for any .prisma files in prisma directory
  const prismaDir = path.join(projectRoot, 'prisma');
  let hasPrismaSchema = false;
  let prismaSchemaPath: string | undefined;

  if (fs.existsSync(prismaDir)) {
    const files = fs.readdirSync(prismaDir);
    const prismaFiles = files.filter(file => file.endsWith('.prisma'));
    if (prismaFiles.length > 0) {
      hasPrismaSchema = true;
      prismaSchemaPath = path.join(prismaDir, prismaFiles[0]); // Use the first one found
    }
  }

  // Check for Prisma client
  const packageJsonPath = path.join(projectRoot, 'package.json');
  let hasPrismaClient = false;
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      hasPrismaClient = !!(packageJson.dependencies?.['@prisma/client'] || packageJson.devDependencies?.['@prisma/client']);
    } catch (error) {
      // Ignore JSON parse errors
    }
  }

  if (hasPrismaSchema && hasPrismaClient) {
    return {
      type: 'prisma',
      schemaPath: prismaSchemaPath,
      hasClient: true
    };
  }

  // Check for Drizzle
  const drizzleConfigFiles = [
    'drizzle.config.ts',
    'drizzle.config.js',
    'src/db/schema.ts',
    'src/schema.ts',
    'db/schema.ts'
  ];

  // Also check for Drizzle schema files in schemas/ directory
  const schemasDir = path.join(projectRoot, 'schemas');
  let drizzleSchemaFiles: string[] = [];
  if (fs.existsSync(schemasDir)) {
    const files = fs.readdirSync(schemasDir);
    drizzleSchemaFiles = files.filter(file => file.endsWith('.ts') && !file.includes('test'));
  }

  // Check for Drizzle connection files
  const drizzleConnectionFiles = [
    'db/connections.ts',
    'db/connection.ts',
    'src/db/connections.ts',
    'src/db/connection.ts'
  ];

  let hasDrizzleORM = false;
  let drizzleConfigPath: string | undefined;

  // Check package.json for drizzle-orm dependency (check current dir and parent)
  const checkPackageJson = (dir: string) => {
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        return !!(packageJson.dependencies?.['drizzle-orm'] || packageJson.devDependencies?.['drizzle-orm']);
      } catch (error) {
        // Ignore JSON parse errors
      }
    }
    return false;
  };

  hasDrizzleORM = checkPackageJson(projectRoot) || checkPackageJson(path.dirname(path.dirname(projectRoot)));

  if (hasDrizzleORM) {
    // Check config files first
    for (const configFile of drizzleConfigFiles) {
      const configPath = path.join(projectRoot, configFile);
      if (fs.existsSync(configPath)) {
        drizzleConfigPath = configPath;
        break;
      }
    }

    // If no config file, check for schema files in schemas/ directory
    if (!drizzleConfigPath && drizzleSchemaFiles.length > 0) {
      drizzleConfigPath = path.join(schemasDir, drizzleSchemaFiles[0]);
    }

    // If still no config, check for connection files
    if (!drizzleConfigPath) {
      for (const connFile of drizzleConnectionFiles) {
        const connPath = path.join(projectRoot, connFile);
        if (fs.existsSync(connPath)) {
          // Check if the connection file imports drizzle-orm
          try {
            const content = fs.readFileSync(connPath, 'utf-8');
            if (content.includes('drizzle-orm') || content.includes('from \'drizzle-orm\'')) {
              drizzleConfigPath = connPath;
              break;
            }
          } catch (error) {
            // Ignore read errors
          }
        }
      }
    }

    if (drizzleConfigPath) {
      return {
        type: 'drizzle',
        configPath: drizzleConfigPath,
        hasClient: true
      };
    }
  }

  return { type: null };
}

/**
 * Gets database connection info for detected ORM
 */
export function getORMConnectionInfo(ormInfo: ORMInfo): { adapter: string; connection: any } | null {
  if (ormInfo.type === 'prisma' && ormInfo.schemaPath) {
    // For Prisma, we'd need to parse the schema to find the database URL
    // For now, return a placeholder that indicates Prisma client should be used
    return {
      adapter: 'prisma',
      connection: 'prisma-client' // Special marker for Prisma
    };
  }

  if (ormInfo.type === 'drizzle' && ormInfo.configPath) {
    // For Drizzle, we'd need to analyze the config file
    // For now, return a placeholder
    return {
      adapter: 'drizzle',
      connection: 'drizzle-db' // Special marker for Drizzle
    };
  }

  return null;
}