export interface ILogger {
  info(message: string): void;
  error(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
}
