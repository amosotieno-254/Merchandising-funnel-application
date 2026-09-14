import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { inventoryRouter } from './api/routes.js';
import { featureFlags } from './config/feature-flags.js';

const app = express();
app.use(cors());
app.use(express.json());

if (featureFlags.inventory) {
  app.use('/api/v1', inventoryRouter);
} else {
  app.use('/api/v1', (_req, res) =>
    res.status(503).json({ success: false, error: 'Module disabled' })
  );
}

const port = Number(process.env.PORT) || 3003;
app.listen(port, () => console.log(`Inventory service running on port ${port}`));