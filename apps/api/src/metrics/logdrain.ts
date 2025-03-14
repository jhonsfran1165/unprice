import type { Logger } from "@unprice/logging"
import { Log, type LogSchema } from "@unprice/logs"
import type { Metric } from "@unprice/metrics"
import type { Metrics } from "./interface"

export class LogdrainMetrics implements Metrics {
  private readonly requestId: string
  private readonly environment: LogSchema["environment"]
  private readonly application: LogSchema["application"]
  private readonly logger: Logger

  constructor(opts: { requestId: string; environment: LogSchema["environment"]; application: LogSchema["application"]; logger: Logger }) {
    this.requestId = opts.requestId
    this.environment = opts.environment
    this.application = opts.application
    this.logger = opts.logger
  }

  public emit(metric: Metric): void {
    const log = new Log({
      requestId: this.requestId,
      type: "metric",
      time: Date.now(),
      metric,
      environment: this.environment,
      application: this.application,
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
