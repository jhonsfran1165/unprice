import { pgTableCreator } from "drizzle-orm/pg-core"

const projectName = "builderai"

export const pgTableProject = pgTableCreator((name) => `${projectName}_${name}`)

// TODO: use this to create a table in all  schemas
