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
 * @param tableName - The name of the table being generated.
 * @param tableSchema - The schema definition for the table.
 * @param resolver - The relationship resolver instance to get foreign keys from.
 * @returns An array of generated records with raw data types.
 */
export function generateDataForTable(
  tableName: string,
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

        // Validate that the faker method exists and is callable
        if (typeof fakerMethod !== 'function') {
          throw new Error(
            `Invalid Faker.js method specified in schema for table "${tableName}" (you provided: "${definition}"). Please check for typos or refer to the Faker.js documentation.`
          );
        }

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
