import { projects } from "../schema/projects"
import { cuid } from "./fields.sql"

// for rest of tables
export const projectID = {
  get id() {
    return cuid("id").notNull()
  },
  get projectId() {
    return cuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" })
  },
}
