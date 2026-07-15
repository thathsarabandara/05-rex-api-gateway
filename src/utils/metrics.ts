import client from 'prom-client';

// Create a custom registry
export const register = new client.Registry();

// Collect node.js default system metrics (GC, Memory, Event Loop)
client.collectDefaultMetrics({ register });

export const httpRequestsTotal = new client.Counter({
  name: 'rex_gateway_http_requests_total',
  help: 'Total number of HTTP requests routed through the gateway',
  labelNames: ['method', 'route', 'status_code']
});
register.registerMetric(httpRequestsTotal);

export const httpRequestDuration = new client.Histogram({
  name: 'rex_gateway_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5, 10]
});
register.registerMetric(httpRequestDuration);

export const downstreamErrorsTotal = new client.Counter({
  name: 'rex_gateway_downstream_errors_total',
  help: 'Total number of downstream errors',
  labelNames: ['service', 'error_type']
});
register.registerMetric(downstreamErrorsTotal);

export const rateLimitRejectionsTotal = new client.Counter({
  name: 'rex_gateway_rate_limit_rejections_total',
  help: 'Total number of rate limit rejections',
  labelNames: ['route', 'key_type']
});
register.registerMetric(rateLimitRejectionsTotal);

export const websocketConnections = new client.Gauge({
  name: 'rex_gateway_websocket_connections',
  help: 'Current active WebSocket connections',
  labelNames: ['route_type']
});
register.registerMetric(websocketConnections);

export const websocketMessagesTotal = new client.Counter({
  name: 'rex_gateway_websocket_messages_total',
  help: 'Total number of WebSocket messages',
  labelNames: ['route_type', 'direction']
});
register.registerMetric(websocketMessagesTotal);

export const serviceHealthGauge = new client.Gauge({
  name: 'rex_gateway_service_health',
  help: 'Status of downstream services (1=healthy, 0=unhealthy)',
  labelNames: ['service_name']
});
register.registerMetric(serviceHealthGauge);
