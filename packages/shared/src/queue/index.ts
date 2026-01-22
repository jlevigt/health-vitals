// Re-exports for clean imports
export type { QueueChannel, QueueConnection, QueueConfig, ConsumeMessage } from "./interface.ts";
export { createQueueConnection, publishJob, Queues } from "./rabbitmq.ts";
export type { QueueName } from "./rabbitmq.ts";
