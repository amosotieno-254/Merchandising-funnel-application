export interface ItemSoldPayload {
  saleId: string;
  registerId: string;
  storeId: string;
  cashierId: string;
  totalAmount: string;
  paymentMethod: string;
  lines: Array<{
    productCode: string;
    quantity: number;
    unitPrice: string;
    discount: string;
    lineTotal: string;
  }>;
}