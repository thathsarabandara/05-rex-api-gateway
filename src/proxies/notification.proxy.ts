import { createServiceProxy } from './proxy.factory.js';
import { services } from '../config/services.js';

export const notificationProxy = createServiceProxy({
  serviceName: services.notification.name,
  target: services.notification.url,
  timeoutMs: services.notification.timeout
});
export default notificationProxy;
