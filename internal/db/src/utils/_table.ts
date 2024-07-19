import { pgTableCreator } from "drizzle-orm/pg-core"

export const projectPrefixBD = "unprice"

export const pgTableProject = pgTableCreator((name) => `${projectPrefixBD}_${name}`)

// TODO: use this to create a table in all  schemas
