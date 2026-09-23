import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { warehouseRouter } from './api/routes.js';
import { featureFlags } from './config/feature-flags.js';
import { startSubscribers } from './events/subscriber.js';

const application = express();
application.use(cors());
application.use(express.json());

if (featureFlags.warehouseOperations) {
  application.use('/api/v1', warehouseRouter);
} else {
  application.use('/api/v1', (_request, response) =>
    response.status(503).json({ success: false, error: 'Module disabled' })
  );
}

const port = Number(process.env.PORT) || 3005;

if (process.env.NODE_ENV !== 'test') {
  application.listen(port, () => {
    console.log(`Warehouse Operations service running on port ${port}`);
    startSubscribers().catch((error) =>
      console.error('Subscriber startup failed:', error)
    );
  });
}

export { application as app };