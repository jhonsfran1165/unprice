import { assign, createMachine } from "xstate"

export const subscriptionMachine = createMachine({
  id: "subscription",
  initial: "idle",
  states: {
    idle: {
      on: {
        START_SUBSCRIPTION: "active",
      },
    },
    active: {
      on: {
        CHANGE_PLAN: "updating",
        CANCEL_SUBSCRIPTION: "canceled",
      },
    },
    updating: {
      entry: assign({
        // Logic to update context with new plan details
      }),
      on: {
        PLAN_UPDATED: {
          target: "active",
        },
      },
    },
    canceled: {
      type: "final",
    },
  },
})
