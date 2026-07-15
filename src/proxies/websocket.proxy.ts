import { IncomingMessage } from 'http';
import { Socket } from 'net';
import { WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';
import { TokenService } from '../services/token.service.js';
import { wsConnectionLimiter, joystickLimiter, armControlLimiter } from '../services/rate-limit.service.js';
import { removeSpoofedHeaders } from '../utils/headers.js';

const WS_PATH_REGEX = /^\/api\/v1\/ws\/robots\/([^\/]+)\/(control|arm|status|telemetry|vision|agent)$/;
const HOP_BY_HOP_HEADERS = [
  'connection',
  'upgrade',
  'sec-websocket-key',
  'sec-websocket-version',
  'sec-websocket-extensions',
  'sec-websocket-protocol',
  'host'
];

const wss = new WebSocketServer({ noServer: true });

/**
 * Handles incoming WebSocket upgrade requests from the HTTP server
 */
export function handleWebSocketUpgrade(req: IncomingMessage, socket: Socket, head: Buffer) {
  const urlPath = req.url ? req.url.split('?')[0] : '';
  const clientIp = req.socket.remoteAddress || 'unknown';

  // 1. Handle Socket.IO notification upgrades
  if (urlPath.startsWith('/socket.io')) {
    wsConnectionLimiter.consume(clientIp).then(() => {
      wss.handleUpgrade(req, socket, head, (clientWs) => {
        logger.info({ clientIp }, '[WS Proxy] Socket.IO connection upgrading');

        const targetWsUrl = config.NOTIFICATION_SERVICE_URL.replace(/^http/, 'ws') + req.url;
        
        // Pass original headers excluding hop-by-hop ones
        const downstreamHeaders: Record<string, string> = {};
        for (const [k, v] of Object.entries(req.headers)) {
          if (v !== undefined && !HOP_BY_HOP_HEADERS.includes(k.toLowerCase())) {
            downstreamHeaders[k] = Array.isArray(v) ? v.join(', ') : String(v);
          }
        }

        const downstreamWs = new WebSocket(targetWsUrl, {
          headers: downstreamHeaders
        });

        let isClosed = false;
        const cleanup = () => {
          if (isClosed) return;
          isClosed = true;
          logger.info('[WS Proxy] Socket.IO connection closed');
          try { clientWs.close(); } catch {}
          try { downstreamWs.close(); } catch {}
        };

        clientWs.on('message', (data: Buffer, isBinary: boolean) => {
          if (downstreamWs.readyState === WebSocket.OPEN) {
            downstreamWs.send(data, { binary: isBinary });
          }
        });
        clientWs.on('close', cleanup);
        clientWs.on('error', (err) => {
          logger.error({ err }, '[WS Proxy] Socket.IO client socket error');
          cleanup();
        });

        downstreamWs.on('message', (data: Buffer, isBinary: boolean) => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(data, { binary: isBinary });
          }
        });
        downstreamWs.on('close', cleanup);
        downstreamWs.on('error', (err) => {
          logger.error({ err }, '[WS Proxy] Socket.IO downstream socket error');
          cleanup();
        });
      });
    }).catch(() => {
      logger.warn({ clientIp }, '[WS Proxy] Socket.IO upgrade rate limit exceeded');
      socket.write('HTTP/1.1 429 Too Many Requests\r\n\r\n');
      socket.destroy();
    });
    return;
  }

  // 2. Handle Robot Control and telemetry WebSocket routes
  const match = urlPath.match(WS_PATH_REGEX);
  if (!match) {
    logger.warn({ path: urlPath }, '[WS Upgrade] Route not matched');
    socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
    socket.destroy();
    return;
  }

  const robotId = match[1];
  const routeType = match[2];

  // Connection rate limit check
  wsConnectionLimiter.consume(clientIp).then(async () => {
    // Extract token
    let token: string | null = null;
    const queryParams = new URL(req.url || '', 'http://localhost').searchParams;
    token = queryParams.get('token');

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      logger.warn({ path: urlPath }, '[WS Upgrade] Missing token');
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    let userAuth: any;
    try {
      userAuth = TokenService.verifyUserToken(token);
    } catch (error: any) {
      logger.warn({ path: urlPath, error: error.message }, '[WS Upgrade] Authentication failed');
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    // Clean spoofed headers and set trace details
    removeSpoofedHeaders(req.headers);
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();

    req.headers['x-user-id'] = userAuth.sub;
    req.headers['x-session-id'] = userAuth.session_id;
    req.headers['x-email-verified'] = String(userAuth.email_verified);
    req.headers['x-internal-service-token'] = config.INTERNAL_SERVICE_TOKEN;
    req.headers['x-gateway-name'] = config.APP_NAME;
    req.headers['x-request-id'] = requestId;

    // Handle Upgrade
    wss.handleUpgrade(req, socket, head, (clientWs) => {
      logger.info(
        { userId: userAuth.sub, robotId, routeType, requestId },
        '[WS Proxy] Established connection'
      );

      // Determine microservice target
      let serviceUrl = config.ROBOT_SERVICE_URL;
      if (routeType === 'telemetry') {
        serviceUrl = config.TELEMETRY_SERVICE_URL;
      } else if (routeType === 'vision') {
        serviceUrl = config.VISION_SERVICE_URL;
      } else if (routeType === 'agent') {
        serviceUrl = config.AGENT_SERVICE_URL;
      }

      const targetWsUrl = serviceUrl.replace(/^http/, 'ws') + req.url;

      // Extract current request headers for downstream excluding hop-by-hop
      const downstreamHeaders: Record<string, string> = {};
      for (const [k, v] of Object.entries(req.headers)) {
        if (v !== undefined && !HOP_BY_HOP_HEADERS.includes(k.toLowerCase())) {
          downstreamHeaders[k] = Array.isArray(v) ? v.join(', ') : String(v);
        }
      }

      const downstreamWs = new WebSocket(targetWsUrl, {
        headers: downstreamHeaders
      });

      // Buffer queue to prevent race conditions during connection phases
      const pendingMessageQueue: { data: Buffer; isBinary: boolean }[] = [];

      let isClosed = false;
      const cleanup = (code: number, reason: string) => {
        if (isClosed) return;
        isClosed = true;
        logger.info({ robotId, routeType, code, reason }, '[WS Proxy] Closed connection');

        try {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.close(code, reason);
          }
        } catch {}
        try {
          if (downstreamWs.readyState === WebSocket.OPEN) {
            downstreamWs.close(code, reason);
          }
        } catch {}
      };

      // Client socket handlers
      clientWs.on('message', async (data: Buffer, isBinary: boolean) => {
        // Enforce maximum size limit
        if (data.length > config.MAX_WEBSOCKET_MESSAGE_KB * 1024) {
          logger.warn(
            { sizeBytes: data.length, robotId, userId: userAuth.sub },
            '[WS Proxy] Message exceeds size limit'
          );
          cleanup(1009, 'Message too big');
          return;
        }

        // Apply message rate-limiters
        const rateLimitKey = `${userAuth.sub}:${robotId}`;
        try {
          if (routeType === 'control') {
            await joystickLimiter.consume(rateLimitKey);
          } else if (routeType === 'arm') {
            await armControlLimiter.consume(rateLimitKey);
          }
        } catch (rlErr) {
          logger.warn({ rateLimitKey, routeType }, '[WS Proxy] Message rate limit exceeded');
          return;
        }

        if (downstreamWs.readyState === WebSocket.OPEN) {
          downstreamWs.send(data, { binary: isBinary });
        } else if (downstreamWs.readyState === WebSocket.CONNECTING) {
          pendingMessageQueue.push({ data, isBinary });
        }
      });

      clientWs.on('close', (code, reason) => {
        cleanup(code, reason.toString());
      });

      clientWs.on('error', (err) => {
        logger.error({ err }, '[WS Proxy] Client WebSocket error');
        cleanup(1011, 'Client error');
      });

      clientWs.on('ping', (data) => {
        if (downstreamWs.readyState === WebSocket.OPEN) {
          downstreamWs.ping(data);
        }
      });

      clientWs.on('pong', (data) => {
        if (downstreamWs.readyState === WebSocket.OPEN) {
          downstreamWs.pong(data);
        }
      });

      // Downstream socket handlers
      downstreamWs.on('open', () => {
        logger.info({ targetWsUrl }, '[WS Proxy] Connected to downstream service');
        // Flush pending queued packets
        while (pendingMessageQueue.length > 0) {
          const item = pendingMessageQueue.shift();
          if (item && downstreamWs.readyState === WebSocket.OPEN) {
            downstreamWs.send(item.data, { binary: item.isBinary });
          }
        }
      });

      downstreamWs.on('message', (data: Buffer, isBinary: boolean) => {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(data, { binary: isBinary });
        }
      });

      downstreamWs.on('close', (code, reason) => {
        cleanup(code, reason.toString());
      });

      downstreamWs.on('error', (err) => {
        logger.error({ err }, '[WS Proxy] Downstream WebSocket error');
        cleanup(1011, 'Downstream error');
      });

      downstreamWs.on('ping', (data) => {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.ping(data);
        }
      });

      downstreamWs.on('pong', (data) => {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.pong(data);
        }
      });
    });
  }).catch(() => {
    logger.warn({ clientIp }, '[WS Upgrade] Connection rate limit exceeded');
    socket.write('HTTP/1.1 429 Too Many Requests\r\n\r\n');
    socket.destroy();
  });
}
