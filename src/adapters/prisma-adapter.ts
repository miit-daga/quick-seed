// // src/adapters/prisma-adapter.ts
import { IDatabaseAdapter } from './base-adapter';

type PrismaTransactionClient = Omit<AnyPrismaClient, '$transaction'>;

type AnyPrismaClient = {
  [model: string]: {
    createMany: (args: { data: any[]; skipDuplicates?: boolean }) => Promise<{ count: number }>;
    findMany: (args?: { where?: any; select?: any; orderBy?: any }) => Promise<any[]>;
    findFirst: (args?: any) => Promise<any | null>;
  };
} & {
  $connect: () => Promise<void>;
  $disconnect: () => Promise<void>;
  $transaction: <R>(
    fn: (tx: PrismaTransactionClient) => Promise<R>,
    options?: { maxWait?: number; timeout?: number }
  ) => Promise<R>;
};

/**
 * An adapter for interacting with a database via the Prisma Client.
 */
export class PrismaAdapter implements IDatabaseAdapter {
  private prisma!: AnyPrismaClient;

  public async connect(prismaClient: AnyPrismaClient): Promise<void> {
    this.prisma = prismaClient;
    await this.prisma.$connect();
    console.log('Prisma Client connected.');
  }

  /**
   * Inserts multiple records using Prisma's `createMany` within an interactive transaction.
   *
   * @param modelName - The name of the Prisma model (e.g., 'user', 'post').
   * @param data - An array of objects to be inserted.
   * @param pk - The name of the primary key of the model. Defaults to 'id'.
   * @param strategy - The retrieval strategy:
   *   - `'sequential'`: (Default) Optimized for auto-incrementing integer keys. Fast and memory-efficient.
   *   - `'lookup'`: Works for any key type (including UUIDs) but may be slow on large tables.
   * @returns A promise that resolves with the array of inserted records.
   */
  public async insert(
    modelName: string,
    data: any[],
    pk: string = 'id',
    strategy: 'sequential' | 'lookup' = 'sequential'
  ): Promise<any[]> {
    if (data.length === 0) {
      return [];
    }

    return this.prisma.$transaction(async (tx) => {
      if (strategy === 'sequential') {
        // --- Optimized for Sequential IDs (Integers) ---
        const lastRecord = await tx[modelName].findFirst({
          orderBy: { [pk]: 'desc' },
        });
        const lastId = lastRecord ? lastRecord[pk] : null;

        await tx[modelName].createMany({ data });

        return tx[modelName].findMany({
          where: lastId ? { [pk]: { gt: lastId } } : {},
          orderBy: { [pk]: 'asc' },
        });

      } else {
        // --- "Anti-Join" for Any ID Type (UUIDs, etc.) ---
        const existingRecords = await tx[modelName].findMany({
          select: { [pk]: true },
        });
        const existingIds = existingRecords.map((record) => record[pk]);

        await tx[modelName].createMany({ data });

        return tx[modelName].findMany({
          where: { [pk]: { notIn: existingIds } },
        });
      }
    });
  }

  public async disconnect(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
      console.log('Prisma Client disconnected.');
    }
  }
}