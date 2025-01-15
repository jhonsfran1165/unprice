import { schedules } from "@trigger.dev/sdk/v3"

import { configure } from "@trigger.dev/sdk/v3"

configure({
  secretKey: process.env.TRIGGER_SECRET_KEY,
})

await schedules.del("sched_e9mhr3yzyiupkk7et27hg")
