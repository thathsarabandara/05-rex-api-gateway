export interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'unavailable';
  latency_ms: number | null;
}

export interface ServicesHealthResponse {
  status: 'healthy' | 'degraded' | 'unavailable';
  services: Record<string, ServiceStatus>;
}
