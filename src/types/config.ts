// src/types/config.ts
import { IDatabaseAdapter } from "../adapters/base-adapter";

/**
 * Configuration object for the main Seeder class.
 */
export interface SeederConfig {
  /** The database adapter instance to use for database operations. */
  adapter: IDatabaseAdapter;
}

/**
 * ------------------------------------------------------------------------
 * Summary:
 *
 * This file defines the `SeederConfig` interface, which represents the
 * configuration object expected by the `Seeder` class.
 *
 * Currently, it contains only one required property:
 * - `adapter`: An instance of a class implementing the `IDatabaseAdapter`
 *   interface, used to handle all database interactions (connect, insert, disconnect).
 *
 * Purpose:
 * Abstracts away the database implementation, allowing the Seeder to be
 * database-agnostic. More config fields (like logging, seed options, etc.)
 * can be added here in the future to support more advanced features.
 * ------------------------------------------------------------------------
 */
