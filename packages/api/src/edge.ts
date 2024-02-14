import { apiKeyRouter } from "./router/edge/apikeys"
import { authRouter } from "./router/edge/auth"
import { domainRouter } from "./router/edge/domains"
import { featureRouter } from "./router/edge/features"
import { planRouter } from "./router/edge/plans"
import { projectRouter } from "./router/edge/projects"
import { stripeRouter } from "./router/edge/stripe"
import { subscriptionRouter } from "./router/edge/subscriptions"
import { workspaceRouter } from "./router/edge/workspaces"
import { createTRPCRouter } from "./trpc"

// Deployed to /trpc/edge/**
export const edgeRouter = createTRPCRouter({
  workspaces: workspaceRouter,
  projects: projectRouter,
  plans: planRouter,
  auth: authRouter,
  apikeys: apiKeyRouter,
  // TODO: put this inside plan
  features: featureRouter,
  subscriptions: subscriptionRouter,
  domains: domainRouter,
  stripe: stripeRouter,
})
