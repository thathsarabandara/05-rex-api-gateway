import { createServiceProxy } from './proxy.factory.js';
import { services } from '../config/services.js';

export const robotProxy = createServiceProxy({
  serviceName: services.robot.name,
  target: services.robot.url,
  timeoutMs: services.robot.timeout
});
export default robotProxy;
