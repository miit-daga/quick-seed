// src/types/config.ts
import { IDatabaseAdapter } from "../adapters/base-adapter";

/**
 * Configuration object for the main Seeder class.
 */
export interface SeederConfig {
  /** The database adapter instance to use for database operations. */
  adapter: IDatabaseAdapter;
}
