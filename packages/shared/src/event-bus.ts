import amqp, { Connection, Channel } from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL ?? 'amqp://mms:mms@localhost:5672';

export const EXCHANGE = 'mms.events';

let connection: Connection | null = null;
let channel: Channel | null = null;

async function getChannel(): Promise<Channel> {
  if (channel) return channel;

  connection = await amqp.connect(RABBITMQ_URL);
  channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

  connection.on('close', () => {
    connection = null;
    channel = null;
  });

  return channel;
}

export async function publishEvent(
  routingKey: string,
  payload: unknown
): Promise<void> {
  const ch = await getChannel();
  const body = Buffer.from(JSON.stringify(payload));
  ch.publish(EXCHANGE, routingKey, body, {
    contentType: 'application/json',
    persistent: true,
  });
}

export async function subscribeEvent(
  routingKeyPattern: string,
  handler: (payload: any) => Promise<void> | void,
  queueName?: string
): Promise<() => Promise<void>> {
  const ch = await getChannel();
  const q = await ch.assertQueue(queueName ?? '', {
    exclusive: !queueName,
    durable: !!queueName,
  });
  await ch.bindQueue(q.queue, EXCHANGE, routingKeyPattern);

  await ch.consume(q.queue, async (msg) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString());
      await handler(payload);
      ch.ack(msg);
    } catch (err) {
      console.error('[event-bus] handler failed:', err);
      ch.nack(msg, false, true);
    }
  });

  return async () => {
    await ch.cancel(q.queue);
  };
}