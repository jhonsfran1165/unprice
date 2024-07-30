import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsTimestamp,
} from "nuqs/server"

export const filtersDataTableParsers = {
  page: parseAsInteger.withDefault(1),
  page_size: parseAsInteger.withDefault(10),
  to: parseAsTimestamp,
  from: parseAsTimestamp,
  search: parseAsString,
}
export const filtersDataTableCache = createSearchParamsCache(filtersDataTableParsers)
