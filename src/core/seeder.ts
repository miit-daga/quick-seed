// src/core/seeder.ts
import { SeederConfig } from '../types/config';
import { Schema } from '../types/schema';
import { getExecutionOrder } from './schema-parser';
import { generateDataForTable } from './data-generator';
import { IDatabaseAdapter } from '../adapters/base-adapter';
import { RelationshipResolver } from './relationship-resolver';

/**
 * Progress callback function type for tracking seeding progress.
 */
export type ProgressCallback = (event: {
  phase: 'starting' | 'table_start' | 'generating' | 'inserting' | 'table_complete' | 'complete';
  table?: string;
  tableIndex?: number;
  totalTables?: number;
  recordsGenerated?: number;
  recordsInserted?: number;
  totalRecords?: number;
  startTime?: number;
}) => void;

/**
 * The main Seeder class that orchestrates the entire database seeding process.
 */
export class Seeder {
  private readonly adapter: IDatabaseAdapter;
  private readonly progressCallback?: ProgressCallback;

  constructor(config: SeederConfig & { progressCallback?: ProgressCallback }) {
    this.adapter = config.adapter;
    this.progressCallback = config.progressCallback;
  }

  /**
   * The main method to seed the database based on a schema.
   */
  public async seed(schema: Schema, dbConnection: any): Promise<void> {
    // Create a new resolver instance for this seed operation.
    const resolver = new RelationshipResolver();
    const startTime = Date.now();

    try {
      await this.adapter.connect(dbConnection);
      console.log('Database connection established.');

      const executionOrder = getExecutionOrder(schema);
      console.log('Seeding order:', executionOrder.join(' -> '));

      // Calculate total records for progress tracking
      const totalRecords = Object.values(schema).reduce((sum, table) => sum + table.count, 0);
      
      this.progressCallback?.({
        phase: 'starting',
        totalTables: executionOrder.length,
        totalRecords,
        startTime
      });

      for (let i = 0; i < executionOrder.length; i++) {
        const tableName = executionOrder[i];
        console.log(`\nProcessing table: ${tableName}`);
        
        this.progressCallback?.({
          phase: 'table_start',
          table: tableName,
          tableIndex: i,
          totalTables: executionOrder.length
        });

        const tableSchema = schema[tableName];

        // Pass the resolver to the data generator
        const dataToInsert = generateDataForTable(tableSchema, resolver);
        console.log(`Generated ${dataToInsert.length} records for ${tableName}.`);

        this.progressCallback?.({
          phase: 'generating',
          table: tableName,
          recordsGenerated: dataToInsert.length
        });

        if (dataToInsert.length > 0) {
          const insertedRecords = await this.adapter.insert(tableName, dataToInsert);
          console.log(`Successfully inserted data into ${tableName}.`);

          this.progressCallback?.({
            phase: 'inserting',
            table: tableName,
            recordsInserted: insertedRecords.length
          });

          // Feed the resolver with the newly inserted data
          resolver.addRecords(tableName, insertedRecords);
          console.log(`Resolver updated with ${insertedRecords.length} records from ${tableName}.`);
        }

        this.progressCallback?.({
          phase: 'table_complete',
          table: tableName,
          tableIndex: i + 1,
          totalTables: executionOrder.length
        });
      }

      this.progressCallback?.({
        phase: 'complete',
        startTime
      });

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
