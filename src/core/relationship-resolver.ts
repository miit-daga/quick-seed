// src/core/relationship-resolver.ts

/**
 * Manages the state of generated data during a seeding process.
 * It stores the records inserted into each table, allowing for the resolution
 * of foreign key relationships.
 */
export class RelationshipResolver {
    /**
     * A map to store the generated records for each table.
     * The key is the table name, and the value is an array of inserted records.
     * e.g., { users: [ { id: 1, ... }, { id: 2, ... } ] }
     */
    private state: Record<string, any[]> = {};
  
    /**
     * Adds the records that were just inserted into a table to the state.
     * @param tableName - The name of the table.
     * @param records - The array of records returned from the database adapter,
     *   which should include their primary keys.
     */
    public addRecords(tableName: string, records: any[]): void {
      this.state[tableName] = records;
    }
  
    /**
     * Retrieves a random record from a specified table.
     * This is used to pick a random parent record for a foreign key.
     * @param tableName - The name of the table to get a record from.
     * @returns A random record from the specified table.
     * @throws An error if the specified table has no records in the state.
     */
    public getRandomRecord(tableName: string): any {
      const records = this.state[tableName];
      if (!records || records.length === 0) {
        throw new Error(`Cannot get a random record from table "${tableName}" because it has not been seeded yet or has no records.`);
      }
      const randomIndex = Math.floor(Math.random() * records.length);
      return records[randomIndex];
    }
  
    /**
     * A getter to allow other parts of the system to read the current state.
     * This can be useful for custom generators.
     */
    public get dbState(): Record<string, any[]> {
      return this.state;
    }
  }



/**
 * ------------------------------------------------------------------------
 * Summary:
 * 
 * The `RelationshipResolver` class plays a crucial role in enabling foreign
 * key relationship resolution during the database seeding process.
 * 
 * Responsibilities:
 * - Maintains a central `state` object that tracks inserted records for each table.
 *   Example: { users: [ { id: 1, name: 'Miit' }, ... ], posts: [ ... ] }
 * - Allows adding new records to the state after each table is seeded.
 * - Supports fetching a random record from a parent table, which is essential
 *   when generating foreign keys (e.g., assigning a random `userId` to a `post`).
 * - Exposes a getter (`dbState`) so that custom generators or other logic
 *   can access the full snapshot of inserted data during seeding.
 * 
 * Importance:
 * This class ensures that dependent tables can safely and randomly reference
 * existing data from parent tables. Without it, generating valid foreign key
 * values during seeding would not be possible.
 * 
 * It will be especially important when building the final step of seeding logic
 * — replacing `__ref__table.field` placeholders with actual values.
 * ------------------------------------------------------------------------
 */
