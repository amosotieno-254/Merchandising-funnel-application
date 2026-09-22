import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { receivingRouter } from './api/routes.js';
import { featureFlags } from './config/feature-flags.js';
import { startSubscribers } from './events/subscriber.js';

const app = express();
app.use(cors());
app.use(express.json());

if (featureFlags.receiving) {
  app.use('/api/v1', receivingRouter);
} else {
  app.use('/api/v1', (_req, res) =>
    res.status(503).json({ success: false, error: 'Module disabled' })
  );
}

const port = Number(process.env.PORT) || 3004;

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Receiving service running on port ${port}`);
    startSubscribers().catch((err) =>
      console.error('Subscriber startup failed:', err)
    );
  });
}

export { app };
