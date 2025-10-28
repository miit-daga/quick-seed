// src/types/schema.ts

/**
 * Defines a custom generator function.
 * @param faker - The faker instance to generate data.
 * @param dbState - A snapshot of the database state, holding all previously generated records.
 * @returns The generated value.
 */
export type CustomGenerator<T> = (faker: any, dbState: Record<string, any[]>) => T;

/**
 * Defines how a single field should be generated.
 * It can be a string representing a faker.js method (e.g., 'person.firstName'),
 * an object for more complex types like references, or a custom function.
 */
export type FieldDefinition =
  | string
  | { references: string }
  | CustomGenerator<any>;

/**
 * Defines the schema for a single database table.
 */
export interface TableSchema {
  /** The number of records to generate. */
  count: number;
  /** A map of field names to their generation definitions. */
  fields: Record<string, FieldDefinition>;
  /** Adapter-specific options (e.g., for primary key strategy). */
  options?: any;
}

/**
 * The main schema definition for the entire database.
 * It's a map of table names to their respective schemas.
 */
export type Schema = Record<string, TableSchema>;
