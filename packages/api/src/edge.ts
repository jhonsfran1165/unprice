import { apiKeyRouter } from "./router/edge/apikey"
import { authRouter } from "./router/edge/auth"
import { canvaRouter } from "./router/edge/canva"
import { domainRouter } from "./router/edge/domain"
import { organizationsRouter } from "./router/edge/organization"
import { pageRouter } from "./router/edge/page"
import { projectRouter } from "./router/edge/project"
import { createTRPCRouter } from "./trpc"

// Deployed to /trpc/edge/**
export const edgeRouter = createTRPCRouter({
  organization: organizationsRouter,
  project: projectRouter,
  page: pageRouter,
  canva: canvaRouter,
  auth: authRouter,
  apikey: apiKeyRouter,
  domain: domainRouter,
})
