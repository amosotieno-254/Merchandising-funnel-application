import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { repository } from '../api/repository.js';

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

async function checkAvailability(call: any, callback: grpc.sendUnaryData<any>) {
  try {
    const { product_code, location, quantity } = call.request;
    const [item] = await repository.findStockByProductAndLocation(product_code, location);
    const onHand = item?.onHand ?? 0;
    const allocated = item?.allocated ?? 0;
    callback(null, {
      available: onHand - allocated >= quantity,
      on_hand: onHand,
      allocated,
    });
  } catch (err) {
    console.error('CheckAvailability failed:', err);
    callback({ code: grpc.status.INTERNAL, message: 'Stock lookup failed' });
  }
}

export function startGrpcServer(address: string) {
  const server = new grpc.Server();
  server.addService(proto.inventory.InventoryService.service, {
    CheckAvailability: checkAvailability,
  });
  server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      console.error('Inventory gRPC server failed to start:', err);
      return;
    }
    console.log(`Inventory gRPC server running on port ${port}`);
  });
  return server;
}
