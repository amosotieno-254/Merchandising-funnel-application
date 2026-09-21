import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { vendorRouter } from './api/routes.js';
import { featureFlags } from './config/feature-flags.js';

const app = express();
app.use(cors());
app.use(express.json());

if (featureFlags.vendorManagement) {
  app.use('/api/v1', vendorRouter);
} else {
  app.use('/api/v1', (_req, res) =>
    res.status(503).json({ success: false, error: 'Module disabled' })
  );
}

const port = Number(process.env.PORT) || 3001;

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () =>
    console.log(`Vendor service running on port ${port}`)
  );
}

export { app };