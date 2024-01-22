import { apiKeyRouter } from "./router/edge/apikey"
import { authRouter } from "./router/edge/auth"
import { canvaRouter } from "./router/edge/canva"
import { domainRouter } from "./router/edge/domain"
import { featureRouter } from "./router/edge/feature"
import { organizationsRouter } from "./router/edge/organization"
import { pageRouter } from "./router/edge/page"
import { planRouter } from "./router/edge/plan"
import { projectRouter } from "./router/edge/project"
import { createTRPCRouter } from "./trpc"

// Deployed to /trpc/edge/**
export const edgeRouter = createTRPCRouter({
  organization: organizationsRouter,
  project: projectRouter,
  page: pageRouter,
  canva: canvaRouter,
  plan: planRouter,
  auth: authRouter,
  apikey: apiKeyRouter,
  feature: featureRouter,
  domain: domainRouter,
})
