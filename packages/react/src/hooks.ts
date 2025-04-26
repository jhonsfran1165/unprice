"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import type { paths } from "@unprice/api/src/openapi"
import { useUnpriceContext } from "./context"

export function useCustomerEntitlements(customerId?: string) {
  const { client } = useUnpriceContext()

  const query = useQuery({
    queryKey: ["customers", "entitlements", customerId],
    queryFn: async () => {
      if (!customerId) throw new Error("Customer ID is required")
      const response = await client.customers.getEntitlements(customerId)
      if (response.error) {
        throw new Error(response.error.message)
      }
      return response.result
    },
    enabled: !!customerId, // Only run query when customerId is provided
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useCustomerCan() {
  const { client } = useUnpriceContext()

  const mutation = useMutation({
    mutationFn: async (
      data: paths["/v1/customer/can"]["post"]["requestBody"]["content"]["application/json"]
    ) => {
      const response = await client.customers.can(data)
      if (response.error) {
        throw new Error(response.error.message)
      }
      return response.result
    },
  })

  return {
    mutate: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  }
}

export function useCustomerPaymentMethods({
  customerId,
  provider,
}: {
  customerId?: string
  provider: paths["/v1/customer/getPaymentMethods"]["post"]["requestBody"]["content"]["application/json"]["provider"]
}) {
  const { client } = useUnpriceContext()

  const query = useQuery({
    queryKey: ["customers", "payment-methods", customerId],
    queryFn: async () => {
      const response = await client.customers.getPaymentMethods({
        customerId: customerId!,
        provider: provider,
      })
      if (response.error) {
        throw new Error(response.error.message)
      }
      return response.result
    },
    retry: false,
    enabled: !!customerId, // Query won't run until explicitly enabled
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useProjects() {
  const { client } = useUnpriceContext()

  const getFeaturesQuery = useQuery({
    queryKey: ["projects", "features"],
    queryFn: async () => {
      const response = await client.projects.getFeatures()
      if (response.error) {
        throw new Error(response.error.message)
      }
      return response.result
    },
  })

  return {
    getFeatures: {
      data: getFeaturesQuery.data,
      isLoading: getFeaturesQuery.isLoading,
      error: getFeaturesQuery.error,
      refetch: getFeaturesQuery.refetch,
    },
  }
}
