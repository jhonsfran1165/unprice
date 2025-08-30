"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useRef } from "react"

interface UseQueryInvalidationOptions {
  /**
   * Param key (e.g., intervalDays)
   */
  paramKey: string | number | boolean
  /**
   * When the data was last updated
   */
  dataUpdatedAt: number
  /**
   * Whether the query is currently fetching
   */
  isFetching: boolean
  /**
   * Function to generate the query key for a given param
   */
  getQueryKey: (param: number | string | boolean) => unknown[]
}

/**
 * Hook to manage query invalidation based on param changes and data updates.
 *
 * This hook tracks when data is updated for different params and automatically
 * invalidates queries for params that have older data than the current one.
 *
 * @example
 * ```ts
 * useQueryInvalidation({
 *   paramKey: [intervalFilter.intervalDays, pageFilter.pageId],
 *   dataUpdatedAt,
 *   isFetching,
 *   getQueryKey: (param1, param2) => [
 *     ["analytics", "getVerificationRegions"],
 *     {
 *       input: { intervalDays: param1, pageId: param2 },
 *       type: "query",
 *     },
 *   ],
 * })
 * ```
 */
export function useQueryInvalidation({
  paramKey,
  dataUpdatedAt,
  isFetching,
  getQueryKey,
}: UseQueryInvalidationOptions) {
  const queryClient = useQueryClient()
  const lastUpdated = useRef(new Map<number | string | boolean, number>())
  const isFirstRender = useRef(true)

  const invalidateQueries = () => {
    // Get the last updated timestamp for the current interval
    const lastUpdateCurrentParam = lastUpdated.current.get(paramKey) ?? 0

    // Find all intervals that have older data than the current interval
    const paramsToInvalidate = Array.from(lastUpdated.current.keys()).filter(
      (param) =>
        param !== paramKey && lastUpdateCurrentParam > (lastUpdated.current.get(param) ?? 0)
    )

    // Invalidate queries for outdated intervals
    for (const param of paramsToInvalidate) {
      console.info("Invalidating queries for param:", param)
      queryClient.invalidateQueries({
        queryKey: getQueryKey(param),
      })
    }
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      // Initialize the map with current data
      lastUpdated.current.set(paramKey, dataUpdatedAt)
      return
    }

    // Update the timestamp for the current param
    lastUpdated.current.set(paramKey, dataUpdatedAt)

    // Invalidate outdated queries when fetching new data
    if (isFetching) {
      invalidateQueries()
    }
  }, [dataUpdatedAt, paramKey, isFetching])

  return {
    /**
     * Manually trigger query invalidation for outdated params
     */
    invalidateQueries,
    /**
     * Get the last updated timestamp for a specific param
     */
    getLastUpdated: useCallback(
      (param: number | string | boolean) => lastUpdated.current.get(param),
      []
    ),
    /**
     * Get all tracked params and their last updated timestamps
     */
    getAllLastUpdated: useCallback(() => new Map(lastUpdated.current), []),
  }
}
