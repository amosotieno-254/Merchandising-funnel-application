import 'dotenv/config';
import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import { fail } from '@mms/shared';
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

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json(fail('Invalid JSON body'));
  }
  console.error('[receiving] request failed:', err);
  res.status(500).json(fail('Internal server error'));
};
app.use(errorHandler);

const port = Number(process.env.PORT) || 3004;

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Receiving service listening on port ${port}`);
    startSubscribers().catch((err) =>
      console.error('[receiving] failed to start subscribers:', err)
    );
  });
}

export { app };