import { ingestionRouter } from "./router/lambda/ingestions"
import { createTRPCRouter } from "./trpc"

// Deployed to /trpc/lambda/**
export const lambdaRouter = createTRPCRouter({
  ingestions: ingestionRouter,
})
