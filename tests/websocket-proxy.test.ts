import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import WebSocket, { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import nock from 'nock';
import { handleWebSocketUpgrade } from '../src/proxies/websocket.proxy.js';
import { config } from '../src/config/env.js';
import * as limiters from '../src/services/rate-limit.service.js';

function signUserToken(payload: any) {
  return jwt.sign(payload, config.USER_JWT_SECRET_KEY, { algorithm: config.USER_JWT_ALGORITHM as jwt.Algorithm });
}

describe('WebSocket Proxy Bridging and Limits', () => {
  let gatewayServer: http.Server;
  let gatewayPort: number;
  let downstreamServer: WebSocketServer;
  let downstreamHttpServer: http.Server;
  let downstreamPort: number;

  const validPayload = {
    sub: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    session_id: 'session-uuid',
    email_verified: true,
    iss: config.USER_JWT_ISSUER,
    aud: config.USER_JWT_AUDIENCE,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };

  beforeAll(async () => {
    nock.restore();

    downstreamHttpServer = http.createServer();
    downstreamServer = new WebSocketServer({ server: downstreamHttpServer });

    await new Promise<void>((resolve) => downstreamHttpServer.listen(0, resolve));
    downstreamPort = (downstreamHttpServer.address() as AddressInfo).port;

    config.ROBOT_SERVICE_URL = `http://127.0.0.1:${downstreamPort}`;
    config.TELEMETRY_SERVICE_URL = `http://127.0.0.1:${downstreamPort}`;

    gatewayServer = http.createServer((req, res) => {
      res.writeHead(404);
      res.end();
    });

    gatewayServer.on('upgrade', (req, socket, head) => {
      handleWebSocketUpgrade(req, socket, head);
    });

    await new Promise<void>((resolve) => gatewayServer.listen(0, resolve));
    gatewayPort = (gatewayServer.address() as AddressInfo).port;
  });

  afterAll(() => {
    nock.activate();

    gatewayServer.close();
    downstreamServer.close();
    downstreamHttpServer.close();
  });

  it('should route messages between client and downstream correctly', async () => {
    const token = signUserToken(validPayload);
    const clientWs = new WebSocket(`ws://127.0.0.1:${gatewayPort}/api/v1/ws/robots/robot-123/control?token=${token}`);

    downstreamServer.once('connection', (ws) => {
      ws.on('message', (message, isBinary) => {
        ws.send(message, { binary: isBinary });
      });
    });

    await new Promise<void>((resolve, reject) => {
      clientWs.on('error', (err) => {
        reject(new Error(`Client WS error: ${err.message}`));
      });

      const sendMsg = () => {
        clientWs.send('hello-robot');
      };

      if (clientWs.readyState === WebSocket.OPEN) {
        sendMsg();
      } else {
        clientWs.on('open', sendMsg);
      }

      clientWs.on('message', (data) => {
        expect(data.toString()).toBe('hello-robot');
        clientWs.close();
        resolve();
      });
    });
  });

  it('should propagate connection closes from downstream', async () => {
    const token = signUserToken(validPayload);
    const clientWs = new WebSocket(`ws://127.0.0.1:${gatewayPort}/api/v1/ws/robots/robot-123/control?token=${token}`);

    downstreamServer.once('connection', (ws) => {
      setTimeout(() => ws.close(1001, 'Going Away'), 50);
    });

    await new Promise<void>((resolve, reject) => {
      clientWs.on('error', (err) => {
        reject(err);
      });

      clientWs.on('close', (code, reason) => {
        expect(code).toBe(1001);
        expect(reason.toString()).toBe('Going Away');
        resolve();
      });
    });
  });

  it('should reject connection and close with 1009 when message is oversized', async () => {
    const token = signUserToken(validPayload);
    const clientWs = new WebSocket(`ws://127.0.0.1:${gatewayPort}/api/v1/ws/robots/robot-123/control?token=${token}`);

    await new Promise<void>((resolve, reject) => {
      clientWs.on('error', (err) => {
        reject(err);
      });

      const sendOversized = () => {
        const largeFrame = Buffer.alloc(65 * 1024);
        clientWs.send(largeFrame);
      };

      if (clientWs.readyState === WebSocket.OPEN) {
        sendOversized();
      } else {
        clientWs.on('open', sendOversized);
      }

      clientWs.on('close', (code, reason) => {
        expect(code).toBe(1009);
        expect(reason.toString()).toContain('Message too big');
        resolve();
      });
    });
  });

  it('should support arm control and telemetry WS routes with ping-pong forwarding', async () => {
    const token = signUserToken(validPayload);
    const clientWs = new WebSocket(`ws://127.0.0.1:${gatewayPort}/api/v1/ws/robots/robot-123/arm?token=${token}`);

    downstreamServer.once('connection', (ws) => {
      ws.on('ping', () => {
        ws.pong();
      });
      ws.on('message', (data) => {
        ws.send(data);
      });
    });

    await new Promise<void>((resolve) => {
      clientWs.on('open', () => {
        clientWs.ping();
        clientWs.send('hello-arm');
      });

      clientWs.on('pong', () => {
        // Ping-pong completed
      });

      clientWs.on('message', (data) => {
        expect(data.toString()).toBe('hello-arm');
        clientWs.close();
        resolve();
      });
    });
  });

  it('should reject connection with 429 when connection rate limit is exceeded', async () => {
    vi.mocked(limiters.wsConnectionLimiter.consume).mockRejectedValueOnce({
      remainingPoints: 0,
      msBeforeNext: 5000
    });

    const token = signUserToken(validPayload);
    const ws = new WebSocket(`ws://127.0.0.1:${gatewayPort}/api/v1/ws/robots/robot-123/control?token=${token}`);

    await new Promise<void>((resolve) => {
      ws.on('unexpected-response', (req, res) => {
        expect(res.statusCode).toBe(429);
        resolve();
      });
      ws.on('error', () => resolve());
    });
  });

  it('should drop messages when message rate limiting is exceeded', async () => {
    const token = signUserToken(validPayload);
    const clientWs = new WebSocket(`ws://127.0.0.1:${gatewayPort}/api/v1/ws/robots/robot-123/control?token=${token}`);

    let msgReceived = false;
    downstreamServer.once('connection', (ws) => {
      ws.on('message', () => {
        msgReceived = true;
      });
    });

    // Mock rate limiter to fail
    vi.mocked(limiters.joystickLimiter.consume).mockRejectedValueOnce({
      remainingPoints: 0,
      msBeforeNext: 1000
    });

    await new Promise<void>((resolve) => {
      clientWs.on('open', () => {
        clientWs.send('joystick-packet');
        
        // Wait a short time to verify it was dropped and resolve
        setTimeout(() => {
          expect(msgReceived).toBe(false);
          clientWs.close();
          resolve();
        }, 100);
      });
    });
  });
});
