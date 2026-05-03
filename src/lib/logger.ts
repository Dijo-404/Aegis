type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type Logger = {
  debug: (message: string, meta?: unknown) => void;
  info: (message: string, meta?: unknown) => void;
  warn: (message: string, meta?: unknown) => void;
  error: (message: string, meta?: unknown) => void;
};

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const currentLevel = (import.meta.env.VITE_QVAC_LOG_LEVEL as LogLevel) ?? 'info';

const shouldLog = (level: LogLevel) => levelOrder[level] >= levelOrder[currentLevel];

const emit = (level: LogLevel, message: string, meta?: unknown) => {
  if (!shouldLog(level)) {
    return;
  }
  if (meta) {
    console[level](message, meta);
  } else {
    console[level](message);
  }
};

export const logger: Logger = {
  debug: (message, meta) => emit('debug', message, meta),
  info: (message, meta) => emit('info', message, meta),
  warn: (message, meta) => emit('warn', message, meta),
  error: (message, meta) => emit('error', message, meta),
};
