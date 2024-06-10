import { BaselimeLogger } from "@baselime/edge-logger"
import { Log } from "@builderai/logs"
import type { Fields, Logger } from "./interface"

interface Context {
  waitUntil: (p: Promise<unknown>) => void
}

export class BaseLimeLogger implements Logger {
  private requestId: string
  private readonly client: BaselimeLogger
  private readonly defaultFields?: Fields

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
  }) {
    this.requestId = opts.requestId
    this.defaultFields = opts?.defaultFields ?? {}

    this.client = new BaselimeLogger({
      apiKey: opts.apiKey,
      ctx: opts.ctx,
      requestId: opts.requestId,
      dataset: opts.dataset,
      isLocalDev: opts.isLocalDev ?? false,
      namespace: opts.namespace,
      service: opts.service,
      ...(opts.flushAfterMs && { flushAfterMs: opts.flushAfterMs }), // flush is created in the client automatically and flush after 10 secs
      ...(opts.flushAfterLogs && { flushAfterLogs: opts.flushAfterLogs }),
    })
  }

  private marshal(
    level: "debug" | "info" | "warn" | "error" | "fatal",
    message: string,
    fields?: Fields
  ): string {
    return new Log({
      type: "log",
      requestId: this.requestId,
      time: Date.now(),
      level,
      message,
      context: { ...this.defaultFields, ...fields },
    }).toString()
  }

  public debug(message: string, fields?: Fields): void {
    this.client.debug(this.marshal("debug", message, fields))
  }
  public info(message: string, fields?: Fields): void {
    this.client.info(this.marshal("info", message, fields))
  }
  public warn(message: string, fields?: Fields): void {
    this.client.warn(this.marshal("warn", message, fields))
  }
  public error(message: string, fields?: Fields): void {
    this.client.error(this.marshal("error", message, fields))
  }
  public fatal(message: string, fields?: Fields): void {
    this.client.error(this.marshal("fatal", message, fields))
  }
  public async flush(): Promise<void> {
    this.client.flush()
  }
  public setRequestId(requestId: string): void {
    this.requestId = requestId
  }
}
