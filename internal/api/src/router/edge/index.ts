import { createTRPCRouter } from "../../trpc"
import { analyticsRouter } from "./analytics"

// Deployed to /trpc/edge/**
// for some reason edge engine is not working for some endpoints
// everything is edge ready but only this endpoints works properly in vercel.
// I'll migrate to cloudflare workers in the future
export const edgeRouter = createTRPCRouter({
  analytics: analyticsRouter,
})
