import { BaselimeLogger } from "@baselime/edge-logger"
import { Log, type LogSchema } from "@unprice/logs"
import type { Fields, Logger } from "./interface"

interface Context {
  waitUntil: (p: Promise<unknown>) => void
}

export class BaseLimeLogger implements Logger {
  private requestId: string
  private readonly client: BaselimeLogger
  private readonly defaultFields?: Fields
  private readonly environment: LogSchema["environment"]
  private readonly application: LogSchema["application"]

  constructor(opts: {
    requestId: string
    defaultFields?: Fields
    apiKey: string
    ctx: Context
    isLocalDev?: boolean
    namespace: string
    service: string
    dataset: string
    flushAfterMs?: number
    flushAfterLogs?: number
    environment: LogSchema["environment"]
    application: LogSchema["application"]
  }) {
    this.requestId = opts.requestId
    this.defaultFields = opts?.defaultFields ?? {}
    this.environment = opts.environment
    this.application = opts.application

    this.client = new BaselimeLogger({
      apiKey: opts.apiKey,
      ctx: {
        waitUntil: opts.ctx.waitUntil,
        passThroughOnException: () => {},
        props: {},
      },
      requestId: opts.requestId,
      dataset: opts.dataset,
      isLocalDev: opts.isLocalDev ?? false,
      namespace: opts.namespace,
      service: opts.service,
      ...(opts.flushAfterMs && { flushAfterMs: opts.flushAfterMs }), // flush is created in the client automatically and flush after 10 secs
      ...(opts.flushAfterLogs && { flushAfterLogs: opts.flushAfterLogs }),
    })
  }

  private marshal(level: "debug" | "info" | "warn" | "error" | "fatal", message: string): string {
    return new Log({
      type: "log",
      requestId: this.requestId,
      time: Date.now(),
      level,
      message,
      environment: this.environment,
      application: this.application,
    }).toString()
  }

  public emit(message: string, fields?: Fields): void {
    this.client.info(message, fields)
  }
  public debug(message: string, fields?: Fields): void {
    this.client.debug(this.marshal("debug", message), {
      ...fields,
      ...this.defaultFields,
      $baselime: {
        type: "metric",
      },
    })
  }
  public info(message: string, fields?: Fields): void {
    this.client.info(this.marshal("info", message), {
      ...fields,
      ...this.defaultFields,
      $baselime: {
        type: "metric",
      },
    })
  }
  public warn(message: string, fields?: Fields): void {
    this.client.warn(this.marshal("warn", message), {
      ...fields,
      ...this.defaultFields,
      $baselime: {
        type: "metric",
      },
    })
  }
  public error(message: string, error: unknown, fields?: Fields): void {
    this.client.error(this.marshal("error", message), {
      ...fields,
      ...this.defaultFields,
      $baselime: {
        type: "metric",
      },
      error,
    })
  }
  public fatal(message: string, fields?: Fields): void {
    this.client.error(this.marshal("fatal", message), {
      ...fields,
      ...this.defaultFields,
      $baselime: {
        type: "metric",
      },
    })
  }
  public async flush(): Promise<void> {
    this.client.flush()
  }
  public setRequestId(requestId: string): void {
    this.requestId = requestId
  }
}
