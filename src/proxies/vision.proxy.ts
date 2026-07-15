import { createServiceProxy } from './proxy.factory.js';
import { services } from '../config/services.js';

export const visionProxy = createServiceProxy({
  serviceName: services.vision.name,
  target: services.vision.url,
  timeoutMs: services.vision.timeout
});
export default visionProxy;
