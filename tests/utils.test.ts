import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { normalizePath } from '../src/utils/paths.js';
import { redactObject } from '../src/utils/redact.js';
import { RequestContextService, requestContextStorage } from '../src/services/request-context.service.js';
import * as errors from '../src/utils/errors.js';
import { errorMiddleware } from '../src/middleware/error.middleware.js';
import { requestSizeMiddleware } from '../src/middleware/request-size.middleware.js';
import { requestIdMiddleware } from '../src/middleware/request-id.middleware.js';
import { hostValidationMiddleware } from '../src/middleware/security.middleware.js';
import { handleProxyError, handleProxyReq } from '../src/proxies/proxy.factory.js';

describe('Utility and Helper Functions', () => {
  describe('paths.ts', () => {
    it('should normalize paths correctly', () => {
      expect(normalizePath('/api/v1/auth/')).toBe('/api/v1/auth');
      expect(normalizePath('/API/v1/robots')).toBe('/api/v1/robots');
      expect(normalizePath('')).toBe('');
      expect(normalizePath('/')).toBe('/');
    });
  });

  describe('redact.ts', () => {
    it('should deeply redact sensitive parameters', () => {
      const input = {
        username: 'user',
        password: 'password123',
        nested: {
          token: 'jwt-token',
          safeField: 'hello'
        },
        arr: [
          { credentials: 'secret-cred' },
          { safe: 'yes' }
        ]
      };

      const result = redactObject(input);
      expect(result.username).toBe('user');
      expect(result.password).toBe('[REDACTED]');
      expect(result.nested.token).toBe('[REDACTED]');
      expect(result.nested.safeField).toBe('hello');
      expect(result.arr[0].credentials).toBe('[REDACTED]');
      expect(result.arr[1].safe).toBe('yes');
    });

    it('should handle non-object inputs', () => {
      expect(redactObject(null)).toBe(null);
      expect(redactObject('string')).toBe('string');
    });
  });

  describe('request-context.service.ts', () => {
    it('should set and retrieve context dynamically', () => {
      requestContextStorage.run({ requestId: 'trace-123' }, () => {
        expect(RequestContextService.getRequestId()).toBe('trace-123');
        expect(RequestContextService.getStore()?.requestId).toBe('trace-123');
      });
      
      expect(RequestContextService.getRequestId()).toBeUndefined();
    });
  });

  describe('errors.ts', () => {
    it('should initialize errors with correct status and code', () => {
      const badReq = new errors.BadRequestError('bad');
      expect(badReq.code).toBe('BAD_REQUEST');
      expect(badReq.status).toBe(400);

      const forbidden = new errors.ForbiddenError();
      expect(forbidden.code).toBe('FORBIDDEN');
      expect(forbidden.status).toBe(403);

      const payloadTooLarge = new errors.PayloadTooLargeError();
      expect(payloadTooLarge.code).toBe('PAYLOAD_TOO_LARGE');
      expect(payloadTooLarge.status).toBe(413);

      const wsUnauth = new errors.WebSocketUnauthorizedError();
      expect(wsUnauth.code).toBe('WEBSOCKET_UNAUTHORIZED');
      expect(wsUnauth.status).toBe(4001);

      const internalErr = new errors.InternalGatewayError();
      expect(internalErr.code).toBe('INTERNAL_GATEWAY_ERROR');
      expect(internalErr.status).toBe(500);

      const timeoutErr = new errors.GatewayTimeoutError();
      expect(timeoutErr.code).toBe('GATEWAY_TIMEOUT');
      expect(timeoutErr.status).toBe(504);

      const serviceUnavail = new errors.ServiceUnavailableError();
      expect(serviceUnavail.code).toBe('SERVICE_UNAVAILABLE');
      expect(serviceUnavail.status).toBe(502);
    });
  });

  describe('error.middleware.ts', () => {
    it('should handle GatewayError', () => {
      const err = new errors.BadRequestError('Invalid parameter');
      const req = { requestId: 'req-123', path: '/foo', method: 'GET' } as import('express').Request;
      const res = {
        headersSent: false,
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as import('express').Response;
      const next = vi.fn();

      errorMiddleware(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid parameter',
          request_id: 'req-123'
        }
      });
    });

    it('should handle ECONNREFUSED network errors', () => {
      const err = { code: 'ECONNREFUSED' };
      const req = { requestId: 'req-123', path: '/foo', method: 'GET' } as import('express').Request;
      const res = {
        headersSent: false,
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as import('express').Response;
      const next = vi.fn();

      errorMiddleware(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Downstream service is currently unreachable',
          request_id: 'req-123'
        }
      });
    });

    it('should handle ETIMEOUT network errors', () => {
      const err = { code: 'ETIMEOUT' };
      const req = { requestId: 'req-123', path: '/foo', method: 'GET' } as import('express').Request;
      const res = {
        headersSent: false,
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as import('express').Response;
      const next = vi.fn();

      errorMiddleware(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(504);
    });

    it('should handle general Error', () => {
      const err = new Error('Something broke');
      const req = { requestId: 'req-123', path: '/foo', method: 'GET' } as import('express').Request;
      const res = {
        headersSent: false,
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as import('express').Response;
      const next = vi.fn();

      errorMiddleware(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should delegate to next if headers are already sent', () => {
      const err = new Error('headers sent');
      const req = { requestId: 'req-123', path: '/foo', method: 'GET' } as import('express').Request;
      const res = {
        headersSent: true
      } as unknown as import('express').Response;
      const next = vi.fn();

      errorMiddleware(err, req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('request-size.middleware.ts', () => {
    it('should pass if no Content-Length is provided', () => {
      const req = { headers: {}, path: '/foo' } as import('express').Request;
      const res = {} as import('express').Response;
      const next = vi.fn();
      requestSizeMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should pass if Content-Length is not a number', () => {
      const req = { headers: { 'content-length': 'invalid' }, path: '/foo' } as import('express').Request;
      const res = {} as import('express').Response;
      const next = vi.fn();
      requestSizeMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should reject if Content-Length exceeds JSON limit', () => {
      const req = { headers: { 'content-length': String(3 * 1024 * 1024) }, path: '/api/v1/auth/login' } as import('express').Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as import('express').Response;
      const next = vi.fn();
      requestSizeMiddleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(413);
    });

    it('should pass if Content-Length exceeds JSON limit but is upload path and below upload limit', () => {
      const req = { headers: { 'content-length': String(3 * 1024 * 1024) }, path: '/api/v1/profile/me/picture' } as import('express').Request;
      const res = {} as import('express').Response;
      const next = vi.fn();
      requestSizeMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('request-id.middleware.ts', () => {
    it('should reuse client-provided request ID', () => {
      const req = { headers: { 'x-request-id': 'client-uuid-999' } } as import('express').Request;
      const res = { setHeader: vi.fn() } as unknown as import('express').Response;
      const next = vi.fn();

      requestIdMiddleware(req, res, next);

      expect(req.requestId).toBe('client-uuid-999');
      expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'client-uuid-999');
    });

    it('should generate a new request ID if client did not provide one', () => {
      const req = { headers: {} } as import('express').Request;
      const res = { setHeader: vi.fn() } as unknown as import('express').Response;
      const next = vi.fn();

      requestIdMiddleware(req, res, next);

      expect(req.requestId).toBeDefined();
      expect(res.setHeader).toHaveBeenCalledWith('x-request-id', req.requestId);
    });
  });

  describe('security.middleware.ts', () => {
    it('should reject requests without Host header', () => {
      const req = { headers: {} } as import('express').Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as import('express').Response;
      const next = vi.fn();

      hostValidationMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should reject requests with untrusted Host header', () => {
      const req = { headers: { host: 'malicious.com' } } as import('express').Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as import('express').Response;
      const next = vi.fn();

      hostValidationMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should reject requests with unallowed CORS origins', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Origin', 'http://unallowed.com')
        .set('Host', 'localhost');

      expect(res.status).toBe(500);
    });
  });

  describe('proxy.factory.ts handleProxyError', () => {
    it('should return immediately if headers are already sent', () => {
      const req = { requestId: 'req-123' } as import('express').Request;
      const res = { headersSent: true, status: vi.fn(), json: vi.fn() } as unknown as import('express').Response;
      
      const result = handleProxyError(new Error('crash'), req, res, 'auth-service');
      expect(result).toBeUndefined();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle host resolution failure (ENOTFOUND)', () => {
      const req = { requestId: 'req-123' } as import('express').Request;
      const res = { headersSent: false, status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as import('express').Response;
      
      handleProxyError({ code: 'ENOTFOUND' }, req, res, 'auth-service');
      expect(res.status).toHaveBeenCalledWith(502);
    });

    it('should handle connection reset (ECONNRESET)', () => {
      const req = { requestId: 'req-123' } as import('express').Request;
      const res = { headersSent: false, status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as import('express').Response;
      
      handleProxyError({ code: 'ECONNRESET' }, req, res, 'auth-service');
      expect(res.status).toHaveBeenCalledWith(504);
    });

    it('should handle unknown proxy failures', () => {
      const req = { requestId: 'req-123' } as import('express').Request;
      const res = { headersSent: false, status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as import('express').Response;
      
      handleProxyError({ code: 'OTHER' }, req, res, 'auth-service');
      expect(res.status).toHaveBeenCalledWith(502);
    });
  });

  describe('proxy.factory.ts handleProxyReq', () => {
    it('should call fixRequestBody if req.body is defined', () => {
      const mockProxyReq = {
        setHeader: vi.fn(),
        write: vi.fn(),
        end: vi.fn(),
        getHeader: vi.fn().mockReturnValue('application/json')
      };
      const req = {
        body: { key: 'value' },
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        readableLength: 0
      } as import('express').Request;
      
      handleProxyReq(mockProxyReq, req, 'auth-service');
      expect(mockProxyReq.setHeader).toHaveBeenCalledWith('Content-Length', expect.any(Number));
      expect(mockProxyReq.write).toHaveBeenCalledWith(JSON.stringify({ key: 'value' }));
    });

    it('should skip fixRequestBody if req.body is undefined', () => {
      const mockProxyReq = {
        setHeader: vi.fn(),
        getHeader: vi.fn().mockReturnValue('application/json')
      };
      const req = {
        body: undefined,
        readableLength: 0
      } as import('express').Request;

      handleProxyReq(mockProxyReq, req, 'auth-service');
      expect(mockProxyReq.setHeader).not.toHaveBeenCalled();
    });
  });
});
