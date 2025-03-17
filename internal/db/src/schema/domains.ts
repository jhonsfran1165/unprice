import { relations } from "drizzle-orm"
import { boolean, foreignKey, index, text } from "drizzle-orm/pg-core"

import { pgTableProject } from "../utils/_table"
import { id, timestamps, workspaceID } from "../utils/fields"
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
    workspace: foreignKey({
      columns: [table.workspaceId],
      foreignColumns: [workspaces.id],
      name: "fk_domain_workspace",
    }).onDelete("cascade"),
  })
)

export const domainsRelations = relations(domains, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [domains.workspaceId],
    references: [workspaces.id],
  }),
}))
