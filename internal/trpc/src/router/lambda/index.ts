import { createTRPCRouter } from "#trpc"
import { apiKeyRouter } from "./apikeys"
import { authRouter } from "./auth"
import { customersRouter } from "./customers"
import { domainRouter } from "./domains"
import { featureRouter } from "./features"
import { ingestionRouter } from "./ingestions"
import { pageRouter } from "./pages"
import { paymentProviderRouter } from "./paymentProvider"
import { planVersionFeatureRouter } from "./planVersionFeatures"
import { planVersionRouter } from "./planVersions"
import { planRouter } from "./plans"
import { projectRouter } from "./projects"
import { subscriptionRouter } from "./subscriptions"
import { workspaceRouter } from "./workspaces"

// Deployed to /trpc/lambda/**
// for some reason edge engine is not working for some endpoints
// everything is edge ready but only this endpoints works properly in vercel.
// I'll migrate to cloudflare workers in the future
export const lambdaEndpoints = {
  planVersionFeatures: planVersionFeatureRouter,
  ingestions: ingestionRouter,
  workspaces: workspaceRouter,
  projects: projectRouter,
  plans: planRouter,
  planVersions: planVersionRouter,
  auth: authRouter,
  apikeys: apiKeyRouter,
  features: featureRouter,
  subscriptions: subscriptionRouter,
  domains: domainRouter,
  customers: customersRouter,
  pages: pageRouter,
  paymentProvider: paymentProviderRouter,
}

export const lambdaRouter = createTRPCRouter(lambdaEndpoints)
