import { apiKeyRouter } from "./router/edge/apikey"
import { authRouter } from "./router/edge/auth"
import { organizationsRouter } from "./router/edge/organization"
import { projectRouter } from "./router/edge/project"
import { createTRPCRouter } from "./trpc"

// Deployed to /trpc/edge/**
export const edgeRouter = createTRPCRouter({
  organization: organizationsRouter,
  project: projectRouter,
  auth: authRouter,
  apikey: apiKeyRouter,
})
