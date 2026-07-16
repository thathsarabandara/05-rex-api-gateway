import http from 'http';
import app from './app.js';
import { config } from './config/env.js';
import { logger } from './config/logger.js';
import { redis } from './config/redis.js';
import { handleWebSocketUpgrade } from './proxies/websocket.proxy.js';

const server = http.createServer(app);

// Intercept HTTP upgrades for WebSockets (joystick, status, agent, Socket.IO, etc.)
server.on('upgrade', (req, socket, head) => {
  handleWebSocketUpgrade(req, socket as import('net').Socket, head);
});

server.listen(config.PORT, () => {
  logger.info(`API Gateway running on port ${config.PORT} [Node: ${process.version}, Mode: ${config.NODE_ENV}]`);
});

// Graceful termination
const shutdown = (signal: string) => {
  logger.info(`[Server] Shutdown triggered by ${signal} - cleaning up resources`);

  server.close(async () => {
    logger.info('[Server] HTTP server stopped accepting connections');
    try {
      await redis.quit();
      logger.info('[Server] Redis client disconnected');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, '[Server] Failed to clean up Redis client');
      process.exit(1);
    }
  });

  // Enforce termination timeout
  setTimeout(() => {
    logger.warn('[Server] Shutdown grace period expired - forcing exit');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
export default server;
