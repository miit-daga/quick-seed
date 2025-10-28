// src/core/schema-parser.ts
import { Schema } from '../types/schema';

/**
 * Analyzes the schema and determines the correct order for table seeding.
 * Uses topological sort to handle foreign key dependencies.
 * @param schema - The complete database schema.
 * @returns An array of table names in the order they should be seeded.
 * @throws An error if a circular dependency is detected.
 */
export function getExecutionOrder(schema: Schema): string[] {
  const tables = Object.keys(schema);
  const dependencies: Record<string, string[]> = {}; // table -> its dependencies
  const dependents: Record<string, string[]> = {};   // table -> what depends on it

  // Initialize maps
  for (const table of tables) {
    dependencies[table] = [];
    dependents[table] = [];
  }

  // Build the dependency graph
  for (const table of tables) {
    for (const fieldName in schema[table].fields) {
      const definition = schema[table].fields[fieldName];
      if (typeof definition === 'object' && 'references' in definition) {
        const referencedTable = definition.references.split('.')[0];
        if (schema[referencedTable] && referencedTable !== table) {
          dependencies[table].push(referencedTable);
          dependents[referencedTable].push(table);
        }
      }
    }
  }

  // Find initial nodes (tables with no dependencies)
  const executionOrder: string[] = [];
  const queue = tables.filter(table => dependencies[table].length === 0);

  // Process the queue
  while (queue.length > 0) {
    const currentTable = queue.shift()!;
    executionOrder.push(currentTable);

    // For each table that depends on the current one, remove the dependency
    for (const dependentTable of dependents[currentTable]) {
      dependencies[dependentTable] = dependencies[dependentTable].filter(
        dep => dep !== currentTable
      );
      // If the dependent table has no other dependencies, add it to the queue
      if (dependencies[dependentTable].length === 0) {
        queue.push(dependentTable);
      }
    }
  }

  // If not all tables are in the order, there's a circular dependency
  if (executionOrder.length !== tables.length) {
    const remaining = tables.filter(t => !executionOrder.includes(t));
    throw new Error(`Circular dependency detected involving tables: ${remaining.join(', ')}`);
  }

  return executionOrder;
}