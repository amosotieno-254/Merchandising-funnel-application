import { repository } from './repository.js';

export const service = {
  listSuppliers() {
    return repository.listSuppliers();
  },

  async getSupplierById(supplierId: string) {
    const [supplier] = await repository.findSupplierById(supplierId);
    return supplier ?? null;
  },

  async createSupplier(values: {
    name: string;
    contactEmail: string;
    paymentTerms: string;
    leadTimeDays: number;
  }) {
    const [created] = await repository.insertSupplier(values);
    return created;
  },

  listSupplierProducts(supplierId: string) {
    return repository.listSupplierProducts(supplierId);
  },

  async addSupplierProduct(values: {
    supplierId: string;
    productCode: string;
    unitCost: string;
  }) {
    const [created] = await repository.insertSupplierProduct(values);
    return created;
  },
};