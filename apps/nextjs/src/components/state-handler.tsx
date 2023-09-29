"use client"

// React
import { enableReactComponents } from "@legendapp/state/config/enableReactComponents"
import { enableReactUse } from "@legendapp/state/config/enableReactUse"
import { configureObservablePersistence } from "@legendapp/state/persist"
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage"

enableReactComponents()
enableReactUse() // This adds the use() function to observables

// Global configuration
configureObservablePersistence({
  // Use Local Storage
  pluginLocal: ObservablePersistLocalStorage,
  // Or IndexedDB
})

export function LegendStateHandler() {
  return null
}
