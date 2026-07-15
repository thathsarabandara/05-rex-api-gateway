import { Response } from 'express';
import { GatewayError } from './errors.js';

export function sendGatewayError(res: Response, error: GatewayError, requestId: string) {
  return res.status(error.status).json({
    success: false,
    error: {
      code: error.code,
      message: error.message,
      request_id: requestId,
    },
  });
}

export function sendRawError(res: Response, status: number, code: string, message: string, requestId: string) {
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
      request_id: requestId,
    },
  });
}
