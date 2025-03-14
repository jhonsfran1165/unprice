import type { Tinybird } from "@chronark/zod-bird";
import type { Logger } from "@unprice/logging";
import type { Cache } from "../cache";
import type { Env } from "../env";
import type { Metrics } from "../metrics";
import type { UsageLimiter } from "../usagelimit";

export type ServiceContext = {
  version: string;
  usagelimit: UsageLimiter;
  analytics: Tinybird;
  cache: Cache;
  logger: Logger;
  metrics: Metrics;
};

export type HonoEnv = {
  Bindings: Env;
  Variables: {

    isolateId: string;
    isolateCreatedAt: number;
    requestId: string;
    requestStartedAt: number;
    workspaceId?: string;
    metricsContext: {
      keyId?: string;
      [key: string]: unknown;
    };
    services: ServiceContext;
    /**
     * IP address or region information
     */
    location: string;
    userAgent?: string;
  };
};
