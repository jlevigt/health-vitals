import amqp from "amqplib";
import type { Channel, ConsumeMessage } from "amqplib";

export interface QueueConfig {
  url?: string;
  hostname?: string;
  port?: number;
  username?: string;
  password?: string;
  vhost?: string;
}

export interface QueueConnection {
  connection: amqp.Connection;
  channel: Channel;
}

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

  return { connection, channel };
}

/**
 * Publish a typed job to a queue
 */
export async function publishJob<T extends object>(
  channel: Channel,
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

export type Connection = amqp.Connection;
export type { Channel, ConsumeMessage };
