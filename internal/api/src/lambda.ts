import { apiKeyRouter } from "./router/lambda/apikeys"
import { authRouter } from "./router/lambda/auth"
import { customersRouter } from "./router/lambda/customers"
import { domainRouter } from "./router/lambda/domains"
import { featureRouter } from "./router/lambda/features"
import { ingestionRouter } from "./router/lambda/ingestions"
import { pageRouter } from "./router/lambda/pages"
import { planVersionFeatureRouter } from "./router/lambda/planVersionFeatures"
import { planVersionRouter } from "./router/lambda/planVersions"
import { planRouter } from "./router/lambda/plans"
import { projectRouter } from "./router/lambda/projects"
import { stripeRouter } from "./router/lambda/stripe"
import { subscriptionRouter } from "./router/lambda/subscriptions"
import { workspaceRouter } from "./router/lambda/workspaces"
import { createTRPCRouter } from "./trpc"

// Deployed to /trpc/lambda/**
// for some reason edge engine is not working for some endpoints
// everything is edge ready but only this endpoints works properly in vercel.
// I'll migrate to cloudflare workers in the future
export const lambdaRouter = createTRPCRouter({
  ingestions: ingestionRouter,
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
  pages: pageRouter,
})
