import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { salesAuditRouter } from './api/routes.js';
import { featureFlags } from './config/feature-flags.js';
import { startSubscribers } from './events/subscriber.js';

const app = express();
app.use(cors());
app.use(express.json());

if (featureFlags.salesAudit) {
  app.use('/api/v1', salesAuditRouter);
} else {
  app.use('/api/v1', (_request, response) =>
    response.status(503).json({ success: false, error: 'Module disabled' })
  );
}

const port = Number(process.env.PORT) || 3007;

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    startSubscribers().catch(() => {});
  });
}

export { app };