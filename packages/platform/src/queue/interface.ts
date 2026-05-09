import type { ConsumeMessage } from "amqplib";

/**
 * Queue channel interface for dependency injection
 */
export interface QueueChannel {
  assertQueue(queue: string, options?: { durable?: boolean }): Promise<void>;
  sendToQueue(
    queue: string,
    content: Buffer,
    options?: { persistent?: boolean; contentType?: string },
  ): boolean;
  consume(queue: string, callback: (msg: ConsumeMessage | null) => void): Promise<void>;
  ack(msg: ConsumeMessage): void;
  nack(msg: ConsumeMessage, allUpTo?: boolean, requeue?: boolean): void;
  prefetch(count: number): Promise<void>;
  checkConnection(): Promise<boolean>;
  close(): Promise<void>;
}

/**
 * Queue connection interface
 */
export interface QueueConnection {
  channel: QueueChannel;
  close(): Promise<void>;
}

export interface QueueConfig {
  url?: string;
  hostname?: string;
  port?: number;
  username?: string;
  password?: string;
  vhost?: string;
}

export type { ConsumeMessage };
