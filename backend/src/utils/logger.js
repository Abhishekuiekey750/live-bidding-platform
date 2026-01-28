/**
 * Simple logger for structured output. In production, replace with Pino/Winston.
 */
export function log(level, msg, meta = {}) {
  const ts = new Date().toISOString();
  const payload = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  console.log(`${ts} [${level}] ${msg}${payload}`);
}

export const logger = {
  info: (msg, meta) => log('INFO', msg, meta),
  warn: (msg, meta) => log('WARN', msg, meta),
  error: (msg, meta) => log('ERROR', msg, meta),
};
