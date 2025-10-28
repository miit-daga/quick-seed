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
