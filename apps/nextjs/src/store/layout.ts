import { observable } from "@legendapp/state"
import { persistObservable } from "@legendapp/state/persist"

export interface Todo {
  id: string
  text: string
}

export const state = observable<{ todos: Todo[] }>({
  todos: [],
})

// Persist this observable
persistObservable(state, {
  local: "layout", // Unique name
})
