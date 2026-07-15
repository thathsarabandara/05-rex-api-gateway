import { createServiceProxy } from './proxy.factory.js';
import { services } from '../config/services.js';

export const agentProxy = createServiceProxy({
  serviceName: services.agent.name,
  target: services.agent.url,
  timeoutMs: services.agent.timeout
});
export default agentProxy;
