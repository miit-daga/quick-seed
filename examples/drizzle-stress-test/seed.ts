import { Seeder } from '../../src/core/seeder';
import { DrizzleAdapter } from '../../src/adapters/drizzle-adapter';
import { Schema } from '../../src/types/schema';
import { createDrizzleConnection } from './db/connections';
import { faker } from '@faker-js/faker';

async function main() {
  const provider = (process.env.DB_PROVIDER as 'postgres' | 'mysql' | 'sqlite') || 'sqlite';
  
  console.log(`Starting Drizzle stress test for provider: ${provider}`);
  
  const { db, schema } = await createDrizzleConnection(provider);
  const adapter = new DrizzleAdapter();

  const seedSchema: Schema = {
    organizations: {
      count: 3,
      fields: { name: 'company.name' },
    },
    users: {
      count: 10,
      fields: {
        email: 'internet.email',
        fullName: 'person.fullName',
      },
    },
    projects: {
      count: 5,
      fields: {
        name: 'commerce.productName',
        organizationId: { references: 'organizations.id' },
      },
    },
    tasks: {
      count: 20,
      fields: {
        title: 'lorem.sentence',
        projectId: { references: 'projects.id' },
        parentTaskId: (faker, db) => {
          if (Math.random() > 0.7 && db.tasks?.length > 0) {
            return faker.helpers.arrayElement(db.tasks).id;
          }
          return null;
        },
        assigneeId: (faker, db) => {
          if (Math.random() > 0.5) {
            return faker.helpers.arrayElement(db.users).id;
          }
          return null;
        },
        metadata: () => ({
          priority: faker.helpers.arrayElement(['Low', 'Medium', 'High']),
          version: faker.system.semver(),
          tags: faker.helpers.arrayElements(['bug', 'feature', 'enhancement', 'documentation'], { min: 0, max: 3 }),
          estimatedHours: faker.number.int({ min: 1, max: 40 }),
        }),
      },
    },
  };

  const seeder = new Seeder({ adapter });

  try {
    await seeder.seed(seedSchema, { db, schema });
    await adapter.disconnect(); // ✅ Ensures connection closes (important for MySQL)
    console.log('Drizzle stress test completed successfully.');
    process.exit(0); // ✅ Forces clean exit
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
