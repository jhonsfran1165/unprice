import { apiKeyRouter } from "./router/edge/apikey"
import { authRouter } from "./router/edge/auth"
import { domainRouter } from "./router/edge/domain"
import { featureRouter } from "./router/edge/feature"
import { planRouter } from "./router/edge/plan"
import { projectRouter } from "./router/edge/project"
import { stripeRouter } from "./router/edge/stripe"
import { subscriptionRouter } from "./router/edge/subscription"
import { workspaceRouter } from "./router/edge/workspace"
import { createTRPCRouter } from "./trpc"

// Deployed to /trpc/edge/**
export const edgeRouter = createTRPCRouter({
  workspace: workspaceRouter,
  project: projectRouter,
  plan: planRouter,
  auth: authRouter,
  apikey: apiKeyRouter,
  // TODO: put this inside plan
  feature: featureRouter,
  subscription: subscriptionRouter,
  domain: domainRouter,
  stripe: stripeRouter,
})
