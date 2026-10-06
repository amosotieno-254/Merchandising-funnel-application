import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { env } from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROTO_PATH = path.resolve(__dirname, '../../../../../contracts/proto/inventory.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto: any = grpc.loadPackageDefinition(packageDefinition);
const client = new proto.inventory.InventoryService(
  env.INVENTORY_GRPC_URL,
  grpc.credentials.createInsecure()
);

export function checkAvailability(
  productCode: string,
  location: string,
  quantity: number
): Promise<{ available: boolean; onHand: number; allocated: number }> {
  return new Promise((resolve, reject) => {
    client.CheckAvailability(
      { product_code: productCode, location, quantity },
      { deadline: Date.now() + 5000 },
      (error: any, response: any) => {
        if (error) return reject(error);
        resolve({
          available: response.available,
          onHand: response.on_hand,
          allocated: response.allocated,
        });
      }
    );
  });
}