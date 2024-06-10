import type { Logger } from "@builderai/logging"
import { Log } from "@builderai/logs"
import type { Metric } from "@builderai/metrics"
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

    this.logger.info(log.toString())
  }

  public async flush(): Promise<void> {
    return this.logger.flush()
  }
}
