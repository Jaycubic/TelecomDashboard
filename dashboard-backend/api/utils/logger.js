// utils/logger.js
// Structured logger for dashboard-backend

function formatMessage(level, metaOrMsg, msg) {
  const timestamp = new Date().toISOString();
  if (typeof metaOrMsg === 'string') {
    return `[${timestamp}] [${level}] ${metaOrMsg}`;
  }
  const metaStr = metaOrMsg ? ` ${JSON.stringify(metaOrMsg)}` : '';
  const messageStr = msg ? ` ${msg}` : '';
  return `[${timestamp}] [${level}]${messageStr}${metaStr}`;
}

const logger = {
  info: (metaOrMsg, msg) => {
    console.log(formatMessage('INFO', metaOrMsg, msg));
  },
  warn: (metaOrMsg, msg) => {
    console.warn(formatMessage('WARN', metaOrMsg, msg));
  },
  error: (metaOrMsg, msg) => {
    if (metaOrMsg instanceof Error) {
      console.error(`[${new Date().toISOString()}] [ERROR] ${msg ? msg + ' : ' : ''}${metaOrMsg.stack || metaOrMsg.message}`);
    } else {
      console.error(formatMessage('ERROR', metaOrMsg, msg));
    }
  },
  debug: (metaOrMsg, msg) => {
    if (process.env.DEBUG || process.env.NODE_ENV === 'development') {
      console.debug(formatMessage('DEBUG', metaOrMsg, msg));
    }
  },
};

module.exports = logger;
