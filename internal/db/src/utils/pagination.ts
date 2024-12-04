import { type SQL, and, asc, between, desc, eq, gt, gte, lt, lte, or } from "drizzle-orm"
import type { PgColumn, PgSelectQueryBuilder } from "drizzle-orm/pg-core"

// this is a simple way to paginate a query, be aware that this is not the most efficient way to do it
// if you have a large dataset you should use a cursor based pagination
export function withPagination<T extends PgSelectQueryBuilder, S>(
  qb: T,
  where: SQL<S>,
  orderByColumns: {
    column: PgColumn
    order: "asc" | "desc"
  }[],
  page = 1,
  pageSize = 10
) {
  return qb
    .where(where)
    .orderBy(() =>
      orderByColumns.map(({ column, order }) => (order === "asc" ? asc(column) : desc(column)))
    )
    .limit(pageSize)
    .offset((page - 1) * pageSize)
}

export function withCursorPagination<T extends PgSelectQueryBuilder>(
  qb: T,
  cursor: {
    primary: {
      column: PgColumn
      order: "asc" | "desc"
      cursor?: ReturnType<PgColumn["mapFromDriverValue"]>
    }
    secondary?: {
      column: PgColumn
      order: "asc" | "desc"
      cursor?: ReturnType<PgColumn["mapFromDriverValue"]>
    }
  },
  pageSize = 10
) {
  // Primary cursor
  const primaryColumn = cursor.primary.column
  const primaryOrder = cursor.primary.order === "asc" ? asc : desc
  const primaryOperator = cursor.primary.order === "asc" ? gt : lt
  const primaryCursor = cursor.primary.cursor

  // Secondary cursor (unique fallback like an id field for a stable sort)
  const secondaryColumn = cursor.secondary ? cursor.secondary.column : null
  const secondaryOrder = cursor.secondary ? (cursor.secondary.order === "asc" ? asc : desc) : null
  const secondaryOperator = cursor.secondary ? (cursor.secondary.order === "asc" ? gt : lt) : null
  const secondaryCursor = cursor.secondary ? cursor.secondary.cursor : undefined

  // Single cursor pagination
  const singleColumnPaginationWhere =
    typeof primaryCursor !== "undefined" ? primaryOperator(primaryColumn, primaryCursor) : undefined

  // Double cursor pagination
  const doubleColumnPaginationWhere =
    secondaryColumn &&
    secondaryOperator &&
    typeof primaryCursor !== "undefined" &&
    typeof secondaryCursor !== "undefined"
      ? or(
          primaryOperator(primaryColumn, primaryCursor),
          and(eq(primaryColumn, primaryCursor), secondaryOperator(secondaryColumn, secondaryCursor))
        )
      : undefined

  // Generate the final where clause
  const paginationWhere = secondaryColumn
    ? doubleColumnPaginationWhere
    : singleColumnPaginationWhere

  return qb
    .where(paginationWhere)
    .orderBy(() => [
      primaryOrder(primaryColumn),
      ...(secondaryColumn && secondaryOrder ? [secondaryOrder(secondaryColumn)] : []),
    ])
    .limit(pageSize)
}

// keep in mind that you have to create the indexes for the columns you are filtering by
export function withDateFilters<T extends object>(
  expressions: (SQL<unknown> | undefined)[],
  filterByColum: PgColumn,
  from: number | null,
  to: number | null
) {
  // Convert the date strings to date objects
  const fromDate = from ? from : undefined
  const toDate = to ? to : undefined

  const where = and(
    and(...expressions),
    fromDate && toDate ? between(filterByColum, fromDate, toDate) : undefined,
    fromDate ? gte(filterByColum, fromDate) : undefined,
    toDate ? lte(filterByColum, toDate) : undefined
  )

  return where as SQL<T>
}
