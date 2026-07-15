import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';
import { PayloadTooLargeError } from '../utils/errors.js';
import { sendGatewayError } from '../utils/responses.js';

/**
 * Validates request size checking Content-Length before parsing or forwarding the body
 */
export function requestSizeMiddleware(req: Request, res: Response, next: NextFunction) {
  const contentLength = req.headers['content-length'];
  if (contentLength) {
    const sizeBytes = parseInt(contentLength, 10);
    if (isNaN(sizeBytes)) {
      next();
      return;
    }

    // Check if the route is an upload route (e.g. user profile picture uploads)
    const isUploadPath = req.path.includes('/picture') || req.path.includes('/upload') || req.path.includes('/avatar');
    const maxLimitMb = isUploadPath ? config.MAX_UPLOAD_BODY_MB : config.MAX_JSON_BODY_MB;
    const maxLimitBytes = maxLimitMb * 1024 * 1024;

    if (sizeBytes > maxLimitBytes) {
      return sendGatewayError(
        res,
        new PayloadTooLargeError(`Payload exceeds limit of ${maxLimitMb}MB`),
        req.requestId || ''
      );
    }
  }
  next();
}
export default requestSizeMiddleware;
