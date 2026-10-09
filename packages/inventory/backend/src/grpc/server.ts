import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { service } from '../api/service.js';

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

async function checkAvailability(
  call: grpc.ServerUnaryCall<any, any>,
  callback: grpc.sendUnaryData<any>
) {
  try {
    const { product_code, location, quantity } = call.request;

    const available = await service.getAvailableQuantity(product_code, location);

    callback(null, {
      available: available >= quantity,
      on_hand: available,
      allocated: 0,
      available_quantity: available,
      message: available >= quantity ? 'In stock' : 'Insufficient stock',
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: (error as Error).message,
    });
  }
}

export function startGrpcServer(port = 50051) {
  const server = new grpc.Server();

  server.addService(inventoryProto.inventory.InventoryService.service, {
    CheckAvailability: checkAvailability,
  });

  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (error, boundPort) => {
      if (error) {
        console.error('gRPC server failed to start:', error);
        return;
      }
      console.log(`Inventory gRPC server listening on port ${boundPort}`);
    }
  );
}