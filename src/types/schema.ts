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
}

/**
 * The main schema definition for the entire database.
 * It's a map of table names to their respective schemas.
 */
export type Schema = Record<string, TableSchema>;



/**
 * ----------------------------------------------
 * Summary:
 * This file defines the types used for creating a flexible, type-safe
 * schema-based data seeding system for development databases.
 *
 * - `CustomGenerator<T>`: A function that generates a value using Faker and the current db state.
 * - `FieldDefinition`: Describes how to generate a field value. It can be:
 *     • A string (faker method path or primitive type),
 *     • A reference to another table,
 *     • A custom generator function.
 * - `TableSchema`: Describes a single table's structure — how many records to generate and how to generate each field.
 * - `Schema`: A map of all tables and their corresponding `TableSchema`s — the complete blueprint for seeding the entire database.
 *
 * This type structure allows easy extension, type safety, and support for complex relationships between tables.
 * ----------------------------------------------
 */
