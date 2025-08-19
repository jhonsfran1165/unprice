import { Log, type LogSchema } from "@unprice/logs"
import type { Fields, Logger } from "./interface"

export class ConsoleLogger implements Logger {
  private requestId: string
  private readonly defaultFields?: Fields

  private readonly environment: LogSchema["environment"]
  private readonly application: LogSchema["application"]

  constructor(opts: {
    requestId: string
    environment: LogSchema["environment"]
    application: LogSchema["application"]
    defaultFields?: Fields
  }) {
    this.requestId = opts.requestId
    this.environment = opts.environment
    this.application = opts.application
    this.defaultFields = opts?.defaultFields ?? {}
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
      environment: this.environment,
      application: this.application,
    }).toString()
  }

  public debug(message: string, fields?: Fields): void {
    console.debug("\x1b[32m%s\x1b[0m", "debug", "-", this.marshal("debug", message, fields))
  }
  public emit(message: string, fields?: Fields): void {
    console.info(this.marshal("debug", message, fields))
  }
  public info(message: string, fields?: Fields): void {
    console.info("\x1b[36m%s\x1b[0m", "info", "-", this.marshal("info", message, fields))
  }
  public warn(message: string, fields?: Fields): void {
    console.warn("\x1b[33m%s\x1b[0m", "warn", "-", this.marshal("warn", message, fields))
  }
  public error(message: string, fields?: Fields): void {
    console.error("\x1b[31m%s\x1b[0m", "error", "-", this.marshal("error", message, fields))
  }
  public fatal(message: string, fields?: Fields): void {
    console.error("\x1b[31m%s\x1b[0m", "fatal", "-", this.marshal("fatal", message, fields))
  }

  public async flush(): Promise<void> {
    return Promise.resolve()
  }

  public setRequestId(requestId: string): void {
    this.requestId = requestId
  }
}
