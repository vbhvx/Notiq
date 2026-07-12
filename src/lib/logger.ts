/**
 * Lightweight structured JSON logger.
 * Outputs structured logs for production observability.
 *
 * In production, these JSON logs can be ingested by any log aggregator
 * (CloudWatch, Datadog, Render's built-in logs, etc.)
 */

type LogLevel = "info" | "warn" | "error";

interface LogContext {
  userId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  [key: string]: unknown;
}

function formatLog(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };

  return JSON.stringify(entry);
}

export const logger = {
  info(message: string, context?: LogContext) {
    console.log(formatLog("info", message, context));
  },

  warn(message: string, context?: LogContext) {
    console.warn(formatLog("warn", message, context));
  },

  error(message: string, error?: unknown, context?: LogContext) {
    const errorInfo: LogContext = { ...context };

    if (error instanceof Error) {
      errorInfo.errorName = error.name;
      errorInfo.errorMessage = error.message;
      if (process.env.NODE_ENV !== "production") {
        errorInfo.stack = error.stack;
      }
    } else if (error !== undefined) {
      errorInfo.errorMessage = String(error);
    }

    console.error(formatLog("error", message, errorInfo));
  },
};
