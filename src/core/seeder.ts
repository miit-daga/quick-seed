// src/core/seeder.ts
import { SeederConfig } from '../types/config';
import { Schema } from '../types/schema';
import { getExecutionOrder } from './schema-parser';
import { generateDataForTable } from './data-generator';
import { IDatabaseAdapter } from '../adapters/base-adapter';
import { RelationshipResolver } from './relationship-resolver';

/**
 * The main Seeder class that orchestrates the entire database seeding process.
 */
export class Seeder {
  private readonly adapter: IDatabaseAdapter;

  constructor(config: SeederConfig) {
    this.adapter = config.adapter;
  }

  /**
   * The main method to seed the database based on a schema.
   */
  public async seed(schema: Schema, dbConnection: any): Promise<void> {
    // Create a new resolver instance for this seed operation.
    const resolver = new RelationshipResolver();

    try {
      await this.adapter.connect(dbConnection);
      console.log('Database connection established.');

      const executionOrder = getExecutionOrder(schema);
      console.log('Seeding order:', executionOrder.join(' -> '));

      for (const tableName of executionOrder) {
        console.log(`\nProcessing table: ${tableName}`);
        const tableSchema = schema[tableName];

        // Pass the resolver to the data generator
        const dataToInsert = generateDataForTable(tableSchema, resolver);
        console.log(`Generated ${dataToInsert.length} records for ${tableName}.`);

        if (dataToInsert.length > 0) {
          const insertedRecords = await this.adapter.insert(tableName, dataToInsert);
          console.log(`Successfully inserted data into ${tableName}.`);

          // Feed the resolver with the newly inserted data
          resolver.addRecords(tableName, insertedRecords);
          console.log(`Resolver updated with ${insertedRecords.length} records from ${tableName}.`);
        }
      }

      console.log('\nSeeding process completed successfully.');

    } catch (error) {
      console.error('\nAn error occurred during the seeding process:', error);
      // Re-throw the error to allow for higher-level handling if needed
      throw error;
    } finally {
      await this.adapter.disconnect();
    }
  }
}



/**
 * ------------------------------------------------------------------------
 * Summary:
 *
 * This file defines the `Seeder` class, which acts as the central coordinator
 * for the entire database seeding process. It is fully database-agnostic and
 * works with any adapter that implements the `IDatabaseAdapter` interface.
 *
 * Key Responsibilities:
 * 1. Accepts a Seeder configuration object containing a database adapter.
 * 2. Connects to the database using `adapter.connect(dbConnection)`.
 * 3. Determines the correct order of table seeding using `getExecutionOrder()`,
 *    ensuring tables with foreign key references are processed after their dependencies.
 * 4. Uses `generateDataForTable(tableSchema, resolver)` to generate records:
 *    - Supports faker strings
 *    - Supports custom generator functions
 *    - Supports relational references via the `RelationshipResolver`
 * 5. Inserts the generated records into the database using `adapter.insert()`.
 * 6. Feeds the inserted records back into the `RelationshipResolver` so that
 *    subsequent tables can resolve foreign key values against actual data.
 * 7. Always disconnects from the database using `adapter.disconnect()`,
 *    whether the seeding succeeds or fails.
 *
 * Why This Matters:
 * - Enables complete and consistent development database bootstrapping.
 * - Supports relational data integrity by resolving references during generation.
 * - Ensures modularity and future extensibility across various database engines.
 *
 * ------------------------------------------------------------------------
 */
