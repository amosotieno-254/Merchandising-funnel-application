import { repository } from './repository.js';

export const service = {
  // Storage bins
  listStorageBins() {
    return repository.listStorageBins();
  },

  async createStorageBin(values: {
    binCode: string;
    zone: string;
    capacity: number;
  }) {
    const [created] = await repository.insertStorageBin(values);
    return created;
  },

  // Putaway tasks
  listPutawayTasks() {
    return repository.listPutawayTasks();
  },

  async completePutawayTask(taskId: string, assignedBinId: string) {
    const [completed] = await repository.completePutawayTask(
      taskId,
      assignedBinId
    );
    return completed ?? null;
  },

  async createPutawayTasksFromGoodsReceived(
    lines: Array<{ productCode: string; receivedQuantity: number }>
  ) {
    await repository.insertPutawayTasks(
      lines.map((line) => ({
        productCode: line.productCode,
        quantity: line.receivedQuantity,
        status: 'PENDING',
      }))
    );
  },

  // Pick tasks
  listPickTasks() {
    return repository.listPickTasks();
  },

  async createPickTask(values: {
    productCode: string;
    quantity: number;
    fromBinId: string | null;
  }) {
    const [created] = await repository.insertPickTask(values);
    return created;
  },

  // Stock transfers
  listStockTransfers() {
    return repository.listStockTransfers();
  },

  async createStockTransfer(values: {
    productCode: string;
    fromLocation: string;
    toLocation: string;
    quantity: number;
  }) {
    const [created] = await repository.insertStockTransfer(values);
    return created;
  },
};