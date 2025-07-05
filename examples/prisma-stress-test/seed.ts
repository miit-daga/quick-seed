// examples/prisma-stress-test/seed.ts
import { PrismaClient } from '@prisma/client';
import { Seeder } from '../../src/core/seeder';
import { PrismaAdapter } from '../../src/adapters/prisma-adapter';
import { Schema } from '../../src/types/schema';
import { faker } from '@faker-js/faker';
const prisma = new PrismaClient();

async function main() {
  // This schema matches our complex SQL stress-test schema
  const schema: Schema = {
    organization: {
      count: 3,
      fields: { name: 'company.name' },
    },
    user: {
      count: 10,
      fields: {
        email: 'internet.email',
        full_name: 'person.fullName',
      },
    },
    project: {
      count: 5,
      fields: {
        name: 'commerce.productName',
        organization_id: { references: 'organization.id' },
      },
    },
    task: {
      count: 20,
      fields: {
        title: 'lorem.sentence',
        project_id: { references: 'project.id' },
        // Custom generator for nullable, self-referencing key
        parent_task_id: (faker, db) => {
          if (Math.random() > 0.7 && db.task?.length > 0) {
            return faker.helpers.arrayElement(db.task).id;
          }
          return null; // 70% of tasks will have no parent
        },
        // Custom generator for nullable foreign key
        assignee_id: (faker, db) => {
          if (Math.random() > 0.5) {
            return faker.helpers.arrayElement(db.user).id;
          }
          return null;
        },
        metadata: () => ({
          priority: faker.helpers.arrayElement(['Low', 'Medium', 'High']),
          version: faker.system.semver(),
        }),
      },
    },
  };

  const seeder = new Seeder({
    adapter: new PrismaAdapter(),
  });

  console.log(`Starting Prisma stress test for provider: ${process.env.DB_PROVIDER}`);
  await seeder.seed(schema, prisma);
  console.log('Prisma stress test completed successfully.');
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });