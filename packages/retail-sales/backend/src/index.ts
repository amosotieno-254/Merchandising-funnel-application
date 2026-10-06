import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { retailSalesRouter } from './api/routes.js';
import { featureFlags } from './config/feature-flags.js';
import { env } from './config/env.js';

const app = express();
app.use(cors());
app.use(express.json());

if (featureFlags.retailSales) {
  app.use('/api/v1', retailSalesRouter);
} else {
  app.use('/api/v1', (_req, res) =>
    res.status(503).json({ success: false, error: 'Module disabled' })
  );
}

if (process.env.NODE_ENV !== 'test') {
  app.listen(env.PORT, () => {
    console.log(`Retail Sales service running on port ${env.PORT}`);
  });
}

export { app };