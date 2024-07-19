import type { Logger } from "@unprice/logging"
import { Log } from "@unprice/logs"
import type { Metric } from "@unprice/metrics"
import type { Metrics } from "./interface"

export class LogdrainMetrics implements Metrics {
  private readonly requestId: string
  private readonly logger: Logger

  constructor(opts: { requestId: string; logger: Logger }) {
    this.requestId = opts.requestId
    this.logger = opts.logger
  }

  public emit(metric: Metric): void {
    const log = new Log<{ type: "metric"; requestId: string; time: number; metric: Metric }>({
      requestId: this.requestId,
      type: "metric",
      time: Date.now(),
      metric,
    })

    this.logger.emit(log.toString(), {
      ...metric,
      $baselime: {
        metricName: metric.metric,
      },
    })
  }

  public async flush(): Promise<void> {
    return this.logger.flush()
  }
}
