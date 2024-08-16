import { pgTableCreator } from "drizzle-orm/pg-core"

export const projectPrefixBD = "unprice"

export const pgTableProject = pgTableCreator((name) => `${projectPrefixBD}_${name}`)
