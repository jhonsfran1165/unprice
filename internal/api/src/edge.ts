import { analyticsRouter } from "./router/edge/analytics"
import { apiKeyRouter } from "./router/edge/apikeys"
import { authRouter } from "./router/edge/auth"
import { customersRouter } from "./router/edge/customers"
import { domainRouter } from "./router/edge/domains"
import { featureRouter } from "./router/edge/features"
import { planVersionFeatureRouter } from "./router/edge/planVersionFeatures"
import { planVersionRouter } from "./router/edge/planVersions"
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
  planVersions: planVersionRouter,
  planVersionFeatures: planVersionFeatureRouter,
  auth: authRouter,
  apikeys: apiKeyRouter,
  features: featureRouter,
  subscriptions: subscriptionRouter,
  domains: domainRouter,
  stripe: stripeRouter,
  customers: customersRouter,
  analytics: analyticsRouter,
})
