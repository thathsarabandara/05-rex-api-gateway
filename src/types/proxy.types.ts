import { Options } from 'http-proxy-middleware';

export interface ProxyOptions extends Options {
  serviceName: string;
  timeoutMs?: number;
}
