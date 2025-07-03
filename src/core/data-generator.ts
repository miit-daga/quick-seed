// src/core/data-generator.ts
import { faker } from '@faker-js/faker';
import { FieldDefinition, TableSchema } from '../types/schema';
import { RelationshipResolver } from './relationship-resolver';

/**
 * Dynamically accesses a nested property of the faker object.
 * E.g., 'person.firstName' -> faker.person.firstName
 */
function getFakerMethod(path: string) {
  return path.split('.').reduce((obj, key) => obj[key], faker as any);
}

/**
 * Generates an array of data records for a single table based on its schema.
 * @param tableSchema - The schema definition for the table.
 * @param resolver - The relationship resolver instance to get foreign keys from.
 * @returns An array of generated records.
 */
export function generateDataForTable(
  tableSchema: TableSchema,
  resolver: RelationshipResolver
): any[] {
  const data = [];
  for (let i = 0; i < tableSchema.count; i++) {
    const record: Record<string, any> = {};
    for (const fieldName in tableSchema.fields) {
      const definition = tableSchema.fields[fieldName];
      let value: any;

      if (typeof definition === 'string') {
        const fakerMethod = getFakerMethod(definition);
        value = fakerMethod();
      } else if (typeof definition === 'function') {
        // Allow custom functions to access the state of previously seeded data.
        value = definition(faker, resolver.dbState);
      } else if (typeof definition === 'object' && 'references' in definition) {
        // Resolve foreign key by selecting a random record from the referenced table.
        const [referencedTable, referencedField] = definition.references.split('.');
        const randomParent = resolver.getRandomRecord(referencedTable);
        value = randomParent[referencedField];
      }

      // Sanitize the generated value to be database-driver-friendly.
      if (value instanceof Date) {
        record[fieldName] = value.toISOString();
      } else if (typeof value === 'boolean') {
        record[fieldName] = value ? 1 : 0;
      } else {
        record[fieldName] = value;
      }
    }
    data.push(record);
  }
  return data;
}

/**
 * ------------------------------------------------------------------------
 * Summary:
 *
 * This module is responsible for generating fake/mock data for a single table
 * based on the provided `TableSchema`. It supports:
 * 
 * 1. Faker-based field generation via dot-path strings (e.g., `'person.email'`)
 * 2. Custom generator functions that receive both the `faker` instance and 
 *    the full `dbState` for complex logic
 * 3. Foreign key resolution via references (e.g., `{ references: 'users.id' }`)
 *    by pulling random existing records from the `RelationshipResolver`
 *
 * Key Features:
 * - Uses `getFakerMethod()` to dynamically access nested faker methods.
 * - Delegates foreign key value resolution to the `RelationshipResolver`,
 *   enabling valid `userId`, `postId`, etc. assignments.
 * - Normalizes special types like `Date` and `boolean` for compatibility
 *   with common SQL engines.
 *
 * Example Use Cases:
 * - `email: 'internet.email'` generates a fake email
 * - `userId: { references: 'users.id' }` links to a seeded user record
 * - `title: (faker) => faker.lorem.words(3)` uses a custom generator
 *
 * This function is a critical part of the Seeder engine, ensuring that all
 * generated records are realistic, relationally consistent, and compatible
 * with the target database.
 * ------------------------------------------------------------------------
 */
