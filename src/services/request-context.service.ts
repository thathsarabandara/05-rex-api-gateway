import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  requestId: string;
  userId?: string;
  robotId?: string;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export class RequestContextService {
  /**
   * Retrieves the current RequestContext store
   */
  public static getStore(): RequestContext | undefined {
    return requestContextStorage.getStore();
  }

  /**
   * Helper to retrieve the current request's unique correlation ID
   */
  public static getRequestId(): string | undefined {
    return this.getStore()?.requestId;
  }
}
export default RequestContextService;
