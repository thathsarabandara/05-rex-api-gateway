import { createServiceProxy } from './proxy.factory.js';
import { services } from '../config/services.js';

export const authProxy = createServiceProxy({
  serviceName: services.auth.name,
  target: services.auth.url,
  timeoutMs: services.auth.timeout
});
export default authProxy;
