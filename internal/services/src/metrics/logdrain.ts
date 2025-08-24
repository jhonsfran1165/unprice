import type { Logger } from "@unprice/logging"
import { Log, type LogSchema } from "@unprice/logs"
import type { Metric } from "@unprice/metrics"
import type { Metrics } from "./interface"

export class LogdrainMetrics implements Metrics {
  private readonly requestId: string
  private readonly logger: Logger
  private readonly environment: LogSchema["environment"]
  private readonly service: LogSchema["service"]

  constructor(opts: {
    requestId: string
    logger: Logger
    environment: LogSchema["environment"]
    service: LogSchema["service"]
  }) {
    this.requestId = opts.requestId
    this.logger = opts.logger
    this.environment = opts.environment
    this.service = opts.service
  }

  public emit(metric: Metric): void {
    const log = new Log({
      requestId: this.requestId,
      type: "metric",
      time: Date.now(),
      metric,
      environment: this.environment,
      service: this.service,
    })

    this.logger.emit(log.toString(), {
      ...metric,
      $axiom: {
        metricName: metric.metric,
      },
    })
  }

  public async flush(): Promise<void> {
    return this.logger.flush()
  }
}
