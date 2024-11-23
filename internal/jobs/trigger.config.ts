import type { TriggerConfig } from "@trigger.dev/sdk/v3"

export const config: TriggerConfig = {
  project: "proj_syspguczrngzfidpjzoy",
  logLevel: "debug",
  enableConsoleLogging: true,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  //The paths for your trigger folders
  triggerDirectories: ["./src/trigger"],
  dependenciesToBundle: [/^@unprice\//, /@t3-oss/, "drizzle-orm", /@neondatabase/],
}