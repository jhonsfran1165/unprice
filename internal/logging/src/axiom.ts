import { Axiom } from "@axiomhq/js"
import { AxiomJSTransport, ConsoleTransport, Logger as LoggerAxiom } from "@axiomhq/logging"
import { Log, type LogSchema } from "@unprice/logs"
import { env } from "../env"
import type { Fields, Logger } from "./interface"

export const axiom = new Axiom({
  token: env.AXIOM_API_TOKEN,
})

export class AxiomLogger implements Logger {
  private requestId: string
  private readonly client: LoggerAxiom
  private readonly defaultFields?: Fields
  private readonly environment: LogSchema["environment"]
  private readonly service: LogSchema["service"]

  constructor(opts: {
    requestId: string
    defaultFields?: Fields
    apiKey: string
    dataset: string
    environment: LogSchema["environment"]
    service: LogSchema["service"]
  }) {
    this.requestId = opts.requestId
    this.defaultFields = {
      ...opts?.defaultFields,
      service: opts.service,
      environment: opts.environment,
    }
    this.environment = opts.environment
    this.service = opts.service

    this.client = new LoggerAxiom({
      transports: [
        new ConsoleTransport({
          prettyPrint: true,
          logLevel: "error", // only log errors
        }),
        new AxiomJSTransport({
          axiom: axiom,
          dataset: opts.dataset,
        }),
      ],
    }).with({
      ...this.defaultFields,
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
      service: this.service,
    }).toString()
  }

  public emit(message: string, fields?: Fields): void {
    this.client.info(this.marshal("info", message), {
      ...fields,
    })
  }
  public debug(message: string, fields?: Fields): void {
    this.client.debug(this.marshal("debug", message), {
      ...fields,
    })
  }
  public info(message: string, fields?: Fields): void {
    this.client.info(this.marshal("info", message), {
      ...fields,
    })
  }
  public warn(message: string, fields?: Fields): void {
    this.client.warn(this.marshal("warn", message), {
      ...fields,
    })
  }
  public error(message: string, error: unknown, fields?: Fields): void {
    this.client.error(this.marshal("error", message), {
      ...fields,
      error,
    })
  }
  public fatal(message: string, fields?: Fields): void {
    this.client.error(this.marshal("fatal", message), {
      ...fields,
    })
  }

  public async flush(): Promise<void> {
    await this.client.flush()
  }

  public setRequestId(requestId: string): void {
    this.requestId = requestId
  }
}
