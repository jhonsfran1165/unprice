import { ingestionRouter } from "./router/lambda/ingestion"
import { stripeRouter } from "./router/lambda/stripe"
import { createTRPCRouter } from "./trpc"

// Deployed to /trpc/lambda/**
export const lambdaRouter = createTRPCRouter({
  stripe: stripeRouter,
  ingestion: ingestionRouter,
})
