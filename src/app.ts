import express from 'express';
import { requestIdMiddleware } from './middleware/request-id.middleware.js';
import { httpLogger } from './config/logger.js';
import security from './middleware/security.middleware.js';
import { requestSizeMiddleware } from './middleware/request-size.middleware.js';
import authRouter from './routes/auth.routes.js';
import robotRouter from './routes/robot.routes.js';
import notificationRouter from './routes/notification.routes.js';
import telemetryRouter from './routes/telemetry.routes.js';
import visionRouter from './routes/vision.routes.js';
import agentRouter from './routes/agent.routes.js';
import healthRouter from './routes/health.routes.js';
import { notFoundMiddleware } from './middleware/not-found.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { httpRequestsTotal, httpRequestDuration } from './utils/metrics.js';

const app = express();

// Trust downstream proxy headers (e.g. Cloudflare / Nginx)
app.set('trust proxy', true);

// 1. Request tracing and Logging
app.use(requestIdMiddleware);
app.use(httpLogger);

// 2. Gateway Security Shields
app.use(security.helmetMiddleware);
app.use(security.corsMiddleware);
app.use(security.hppMiddleware);
app.use(security.hostValidationMiddleware);

// 3. Size limits
app.use(requestSizeMiddleware);

// Prometheus metric logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    // Fallback to URL path if route is not matched
    const routePath = req.route ? req.route.path : req.path;
    httpRequestsTotal.inc({ method: req.method, route: routePath, status_code: String(res.statusCode) });
    httpRequestDuration.observe({ method: req.method, route: routePath, status_code: String(res.statusCode) }, duration);
  });
  next();
});

// 4. Health and Metric interfaces
app.use('/', healthRouter);

// 5. Proxy-routed domains
app.use('/api/v1', authRouter);
app.use('/api/v1', robotRouter);
app.use('/api/v1', notificationRouter);
app.use('/api/v1', telemetryRouter);
app.use('/api/v1', visionRouter);
app.use('/api/v1', agentRouter);

// 6. 404 Route Catch
app.use(notFoundMiddleware);

// 7. Global Error Sanitization
app.use(errorMiddleware);

export default app;
export { app };
