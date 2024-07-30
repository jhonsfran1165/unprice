import type { SQL } from "@unprice/db"

export * from "./generate-pattern"
export * from "./project-guard"

export type DrizzleWhere<T> = SQL<unknown> | ((aliases: T) => SQL<T> | undefined) | undefined
