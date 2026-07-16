import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import WebSocket from 'ws';
import { handleWebSocketUpgrade } from '../src/proxies/websocket.proxy.js';
import { config } from '../src/config/env.js';
import { signUserToken } from './helpers.js';

describe('WebSocket Authentication Handshake', () => {
  let server: http.Server;
  let port: number;

  beforeAll(() => {
    server = http.createServer((req, res) => {
      res.writeHead(404);
      res.end();
    });

    server.on('upgrade', (req, socket, head) => {
      handleWebSocketUpgrade(req, socket, head);
    });

    server.listen(0);
    port = (server.address() as AddressInfo).port;
  });

  afterAll(() => {
    server.close();
  });

  it('should reject connection when token query parameter is missing', async () => {
    const ws = new WebSocket(`ws://localhost:${port}/api/v1/ws/robots/robot-123/control`);

    await new Promise<void>((resolve) => {
      ws.on('unexpected-response', (req, res) => {
        expect(res.statusCode).toBe(401);
        resolve();
      });
      ws.on('error', () => {
        resolve();
      });
    });
  });

  it('should reject connection when token is invalid or expired', async () => {
    const expiredPayload = {
      sub: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      session_id: 'session-uuid',
      email_verified: true,
      iss: config.USER_JWT_ISSUER,
      aud: config.USER_JWT_AUDIENCE,
      iat: Math.floor(Date.now() / 1000) - 3600,
      exp: Math.floor(Date.now() / 1000) - 60
    };
    const token = signUserToken(expiredPayload);

    const ws = new WebSocket(`ws://localhost:${port}/api/v1/ws/robots/robot-123/control?token=${token}`);

    await new Promise<void>((resolve) => {
      ws.on('unexpected-response', (req, res) => {
        expect(res.statusCode).toBe(401);
        resolve();
      });
      ws.on('error', () => {
        resolve();
      });
    });
  });

  it('should return 404 when WebSocket URL does not match any route', async () => {
    const ws = new WebSocket(`ws://localhost:${port}/api/v1/ws/robots/unknown-path`);

    await new Promise<void>((resolve) => {
      ws.on('unexpected-response', (req, res) => {
        expect(res.statusCode).toBe(404);
        resolve();
      });
      ws.on('error', () => {
        resolve();
      });
    });
  });
});

