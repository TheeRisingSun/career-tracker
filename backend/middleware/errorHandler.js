import { logEvent } from '../lib/db.js';

/**
 * Centralized error handling middleware.
 * Logs errors and returns consistent JSON error response.
 */
export async function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  if (res.headersSent) {
    return next(err);
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error('[error]', err.stack || message);
    // Log to MongoDB
    await logEvent('error', message, {
      userId: req.user?.id || req.user?._id,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
    });
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && err.stack && { stack: err.stack }),
  });
}

/** 404 for unknown routes */
export function notFound(req, res, next) {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` });
}
