import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const protoPath = path.resolve(
  __dirname,
  '../../../../../contracts/proto/inventory.proto'
);

const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const inventoryProto = grpc.loadPackageDefinition(packageDefinition) as any;

const client = new inventoryProto.inventory.InventoryService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

export function checkStockAvailability(input: {
  productCode: string;
  location: string;
  quantity: number;
}): Promise<{
  available: boolean;
  onHand: number;
  availableQuantity: number;
  message: string;
}> {
  return new Promise((resolve, reject) => {
    client.CheckAvailability(
      {
        product_code: input.productCode,
        location: input.location,
        quantity: input.quantity,
      },
      (error: any, response: any) => {
        if (error) return reject(error);
        resolve({
          available: response.available,
          onHand: response.on_hand,
          availableQuantity: response.available_quantity,
          message: response.message,
        });
      }
    );
  });
}