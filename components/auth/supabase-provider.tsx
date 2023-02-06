"use client"

import { createContext, useContext, useState } from "react"
import type { SupabaseClient } from "@supabase/auth-helpers-nextjs"

import type { Database } from "@/lib/supabase/database.types"
import { createBrowserClient } from "@/lib/supabase/supabase-browser"

type SupabaseContext = {
  supabase: SupabaseClient<Database>
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [supabase] = useState(() => createBrowserClient())

  return (
    <Context.Provider value={{ supabase }}>
      <>{children}</>
    </Context.Provider>
  )
}

export const useSupabase = () => {
  if (Context === undefined) {
    throw new Error("useSupabase must be used inside SupabaseProvider")
  }

  return useContext(Context)
}
