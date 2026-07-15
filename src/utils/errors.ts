export class GatewayError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends GatewayError {
  constructor(message: string = 'Bad request') {
    super('BAD_REQUEST', message, 400);
  }
}

export class UnauthorizedError extends GatewayError {
  constructor(message: string = 'Authentication required') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class ForbiddenError extends GatewayError {
  constructor(message: string = 'Access denied') {
    super('FORBIDDEN', message, 403);
  }
}

export class RouteNotFoundError extends GatewayError {
  constructor(message: string = 'Endpoint not found') {
    super('ROUTE_NOT_FOUND', message, 404);
  }
}

export class PayloadTooLargeError extends GatewayError {
  constructor(message: string = 'Payload too large') {
    super('PAYLOAD_TOO_LARGE', message, 413);
  }
}

export class RateLimitExceededError extends GatewayError {
  constructor(message: string = 'Too many requests') {
    super('RATE_LIMIT_EXCEEDED', message, 429);
  }
}

export class ServiceUnavailableError extends GatewayError {
  constructor(message: string = 'Downstream service unavailable') {
    super('SERVICE_UNAVAILABLE', message, 502);
  }
}

export class GatewayTimeoutError extends GatewayError {
  constructor(message: string = 'Downstream service timeout') {
    super('GATEWAY_TIMEOUT', message, 504);
  }
}

export class WebSocketUnauthorizedError extends GatewayError {
  constructor(message: string = 'WebSocket authentication failed') {
    super('WEBSOCKET_UNAUTHORIZED', message, 4001);
  }
}

export class InternalGatewayError extends GatewayError {
  constructor(message: string = 'Internal gateway error') {
    super('INTERNAL_GATEWAY_ERROR', message, 500);
  }
}
