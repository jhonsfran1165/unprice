import { relations } from "drizzle-orm"
import { boolean, index, text } from "drizzle-orm/pg-core"

import { pgTableProject } from "../utils/_table"
import { id, timestamps, workspaceID } from "../utils/sql"
import { workspaces } from "./workspaces"

export const domains = pgTableProject(
  "domains",
  {
    ...id,
    ...timestamps,
    ...workspaceID,
    name: text("name").notNull().unique(), //domain name (e.g. builder.ai or test.unprice.com)
    apexName: text("apex_name").notNull(), //apex domain name (e.g. builder.ai)
    verified: boolean("verified").default(false),
  },
  (table) => ({
    name: index("name").on(table.name),
  })
)

export const domainsRelations = relations(domains, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [domains.workspaceId],
    references: [workspaces.id],
  }),
}))
