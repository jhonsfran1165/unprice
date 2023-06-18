"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useSupabase } from "./supabase-provider"

// this component handles refreshing server data when the user logs in or out
// this method avoids the need to pass a session down to child components
// in order to re-render when the user's session changes
export default function SupabaseListener({
  serverAccessToken,
}: {
  serverAccessToken?: string
}) {
  const { supabase } = useSupabase()
  const router = useRouter()

  const handleRefreshToken = async (payload) => {
    // refreshing supabase JWT
    const { error } = await supabase.auth.refreshSession()
    // if refresh token is expired or something else then logout
    if (error) await supabase.auth.signOut()
  }

  // hacky aproach to refresh JWT token once organization tables change
  useEffect(() => {
    const channel = supabase
      .channel("*")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "organization_subscriptions",
        },
        handleRefreshToken
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "organization_subscriptions",
        },
        handleRefreshToken
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "organization_profiles",
        },
        handleRefreshToken
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "organization",
        },
        handleRefreshToken
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(event)
      if (session?.access_token !== serverAccessToken) {
        // server and client are out of sync
        // reload the page to fetch fresh server data
        // https://beta.nextjs.org/docs/data-fetching/mutating
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [serverAccessToken, router, supabase])

  return null
}
