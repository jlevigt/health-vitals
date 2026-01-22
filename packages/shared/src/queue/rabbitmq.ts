import amqp, { type Channel, type ConsumeMessage } from "amqplib";
import type { QueueConfig, QueueConnection, QueueChannel } from "./interface.ts";

/**
 * Create a connection to RabbitMQ
 */
export async function createQueueConnection(
  config?: QueueConfig
): Promise<QueueConnection> {
  const url =
    config?.url ??
    process.env.RABBITMQ_URL ??
    `amqp://${config?.username ?? process.env.RABBITMQ_USER ?? "guest"}:${
      config?.password ?? process.env.RABBITMQ_PASSWORD ?? "guest"
    }@${config?.hostname ?? process.env.RABBITMQ_HOST ?? "localhost"}:${
      config?.port ?? parseInt(process.env.RABBITMQ_PORT ?? "5672")
    }/${config?.vhost ?? process.env.RABBITMQ_VHOST ?? ""}`;

  const connection = await amqp.connect(url);
  const channel = await connection.createChannel();

  return {
    channel: wrapChannel(channel),
    async close() {
      await channel.close();
      await connection.close();
    },
  };
}

/**
 * Wrap amqplib channel to match QueueChannel interface
 */
function wrapChannel(channel: Channel): QueueChannel {
  return {
    async assertQueue(queue: string, options?: { durable?: boolean }) {
      await channel.assertQueue(queue, options);
    },
    sendToQueue(queue: string, content: Buffer, options?: { persistent?: boolean; contentType?: string }) {
      return channel.sendToQueue(queue, content, options);
    },
    async consume(queue: string, callback: (msg: ConsumeMessage | null) => void) {
      await channel.consume(queue, callback);
    },
    ack(msg: ConsumeMessage) {
      channel.ack(msg);
    },
    nack(msg: ConsumeMessage, allUpTo?: boolean, requeue?: boolean) {
      channel.nack(msg, allUpTo, requeue);
    },
    async prefetch(count: number) {
      await channel.prefetch(count);
    },
    async close() {
      await channel.close();
    },
  };
}

/**
 * Publish a typed job to a queue
 */
export async function publishJob<T extends object>(
  channel: QueueChannel,
  queue: string,
  job: T,
  options?: { persistent?: boolean }
): Promise<boolean> {
  await channel.assertQueue(queue, { durable: true });

  return channel.sendToQueue(queue, Buffer.from(JSON.stringify(job)), {
    persistent: options?.persistent ?? true,
    contentType: "application/json",
  });
}

/**
 * Queue names used across the application
 */
export const Queues = {
  FILE_PROCESSING: "file_processing",
} as const;

export type QueueName = (typeof Queues)[keyof typeof Queues];

export type { Channel, ConsumeMessage };
