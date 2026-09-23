import { eq } from 'drizzle-orm';
import { database } from '../infrastructure/db.js';
import {
  storageBins,
  putawayTasks,
  pickTasks,
  stockTransfers,
} from '../infrastructure/schema.js';

export const repository = {
  // Storage bins
  listStorageBins() {
    return database.select().from(storageBins);
  },

  insertStorageBin(values: {
    binCode: string;
    zone: string;
    capacity: number;
  }) {
    return database.insert(storageBins).values(values).returning();
  },

  // Putaway tasks
  listPutawayTasks() {
    return database.select().from(putawayTasks);
  },

  insertPutawayTasks(
    values: Array<{
      productCode: string;
      quantity: number;
      status: string;
    }>
  ) {
    if (values.length === 0) return Promise.resolve([]);
    return database.insert(putawayTasks).values(values).returning();
  },

  completePutawayTask(taskId: string, assignedBinId: string) {
    return database
      .update(putawayTasks)
      .set({ status: 'COMPLETED', assignedBinId })
      .where(eq(putawayTasks.id, taskId))
      .returning();
  },

  // Pick tasks
  listPickTasks() {
    return database.select().from(pickTasks);
  },

  insertPickTask(values: {
    productCode: string;
    quantity: number;
    fromBinId: string | null;
  }) {
    return database.insert(pickTasks).values(values).returning();
  },

  // Stock transfers
  listStockTransfers() {
    return database.select().from(stockTransfers);
  },

  insertStockTransfer(values: {
    productCode: string;
    fromLocation: string;
    toLocation: string;
    quantity: number;
  }) {
    return database.insert(stockTransfers).values(values).returning();
  },
};