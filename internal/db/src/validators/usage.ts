import type { InferSelectModel } from "drizzle-orm"
import type { usage } from "../schema"

export type Usage = InferSelectModel<typeof usage>
