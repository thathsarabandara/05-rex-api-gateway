import { createServiceProxy } from './proxy.factory.js';
import { services } from '../config/services.js';

export const telemetryProxy = createServiceProxy({
  serviceName: services.telemetry.name,
  target: services.telemetry.url,
  timeoutMs: services.telemetry.timeout
});
export default telemetryProxy;
