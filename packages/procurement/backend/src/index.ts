import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { procurementRouter } from './api/routes.js';
import { featureFlags } from './config/feature-flags.js';

const app = express();
app.use(cors());
app.use(express.json());

if (featureFlags.procurement) {
  app.use('/api/v1', procurementRouter);
} else {
  app.use('/api/v1', (_req, res) =>
    res.status(503).json({ success: false, error: 'Module disabled' })
  );
}
// catch-all error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(' Unhandled route error:', err);
  res.status(500).json({ success: false, error: String(err?.message ?? err) });
});

const port = Number(process.env.PORT) || 3002;
app.listen(port, () => console.log(`Procurement service running on port ${port}`));