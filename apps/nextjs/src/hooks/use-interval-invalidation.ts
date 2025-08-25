"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useRef } from "react"

interface UseIntervalQueryInvalidationOptions {
  /**
   * The current interval (e.g., intervalDays)
   */
  currentInterval: number
  /**
   * When the data was last updated
   */
  dataUpdatedAt: number
  /**
   * Whether the query is currently fetching
   */
  isFetching: boolean
  /**
   * Function to generate the query key for a given interval
   */
  getQueryKey: (interval: number) => unknown[]
}

/**
 * Hook to manage query invalidation based on interval changes and data updates.
 *
 * This hook tracks when data is updated for different intervals and automatically
 * invalidates queries for intervals that have older data than the current one.
 *
 * @example
 * ```ts
 * useIntervalQueryInvalidation({
 *   currentInterval: intervalFilter.intervalDays,
 *   dataUpdatedAt,
 *   isFetching,
 *   getQueryKey: (interval) => [
 *     ["analytics", "getVerificationRegions"],
 *     {
 *       input: { intervalDays: interval },
 *       type: "query",
 *     },
 *   ],
 * })
 * ```
 */
export function useIntervalQueryInvalidation({
  currentInterval,
  dataUpdatedAt,
  isFetching,
  getQueryKey,
}: UseIntervalQueryInvalidationOptions) {
  const queryClient = useQueryClient()
  const lastUpdated = useRef(new Map<number, number>())
  const isFirstRender = useRef(true)

  const invalidateQueries = () => {
    // Get the last updated timestamp for the current interval
    const lastUpdateCurrentInterval = lastUpdated.current.get(currentInterval) ?? 0

    // Find all intervals that have older data than the current interval
    const intervalsToInvalidate = Array.from(lastUpdated.current.keys()).filter(
      (interval) =>
        interval !== currentInterval &&
        lastUpdateCurrentInterval > (lastUpdated.current.get(interval) ?? 0)
    )

    // Invalidate queries for outdated intervals
    for (const interval of intervalsToInvalidate) {
      console.info("Invalidating queries for interval:", interval)
      queryClient.invalidateQueries({
        queryKey: getQueryKey(interval),
      })
    }
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      // Initialize the map with current data
      lastUpdated.current.set(currentInterval, dataUpdatedAt)
      return
    }

    // Update the timestamp for the current interval
    lastUpdated.current.set(currentInterval, dataUpdatedAt)

    // Invalidate outdated queries when fetching new data
    if (isFetching) {
      invalidateQueries()
    }
  }, [dataUpdatedAt, currentInterval, isFetching])

  return {
    /**
     * Manually trigger query invalidation for outdated intervals
     */
    invalidateQueries,
    /**
     * Get the last updated timestamp for a specific interval
     */
    getLastUpdated: useCallback((interval: number) => lastUpdated.current.get(interval), []),
    /**
     * Get all tracked intervals and their last updated timestamps
     */
    getAllLastUpdated: useCallback(() => new Map(lastUpdated.current), []),
  }
}
