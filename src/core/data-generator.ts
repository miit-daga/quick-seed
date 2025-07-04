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
 * It returns raw data types (like Date objects) and relies on the
 * specific database adapter to handle formatting.
 * @param tableSchema - The schema definition for the table.
 * @param resolver - The relationship resolver instance to get foreign keys from.
 * @returns An array of generated records with raw data types.
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

      record[fieldName] = value;
    }
    data.push(record);
  }
  return data;
}

/**
 * ------------------------------------------------------------------------
 * Summary:
 *
 * This module handles the dynamic generation of mock data for a single table
 * based on its schema definition. It supports faker paths, custom generators,
 * and foreign key resolution using a relationship resolver.
 *
 * Key Functionalities:
 *
 * 1. `getFakerMethod(path: string)`:
 *    - Dynamically navigates the `faker` object based on a string path like
 *      `'internet.email'`, resolving to `faker.internet.email`.
 *    - Enables flexible and declarative faker usage in schema definitions.
 *
 * 2. `generateDataForTable(tableSchema, resolver)`:
 *    - Iterates `count` times to create an array of records.
 *    - Supports three types of field definitions:
 *      a. **String** — Resolved as a faker method using `getFakerMethod`.
 *      b. **Function** — A `CustomGenerator` that receives the faker instance
 *         and full database state to generate more complex or dependent values.
 *      c. **Reference Object** — Resolves a foreign key value by selecting a
 *         random record from the referenced table (using the `resolver`).
 *    - Produces raw JavaScript values (e.g., `Date`, `boolean`) which are later
 *      formatted or converted appropriately by database adapters.
 *
 * Design Notes:
 * - All foreign key handling is delegated to `RelationshipResolver`.
 * - This function is fully decoupled from the database implementation.
 * - Designed to work in tandem with `Seeder` and any `IDatabaseAdapter`.
 *
 * This logic powers the core of the data generation engine and ensures
 * consistency, flexibility, and relational integrity when generating seed data.
 * ------------------------------------------------------------------------
 */
