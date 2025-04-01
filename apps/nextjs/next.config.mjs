import "@unprice/auth/env"
import "@unprice/stripe/env"
import "@unprice/trpc/env"
import "./src/env.ts"

import path from "node:path"

import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// import MillionLint from "@million/lint"
import createMDX from "@next/mdx"

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  /** Enables hot reloading for local packages without a build step */
  transpilePackages: [
    "@unprice/trpc",
    "@unprice/db",
    "@unprice/stripe",
    "@unprice/ui",
    "@unprice/auth",
    "@unprice/config",
    "@unprice/tailwind-config",
  ],
  pageExtensions: ["ts", "tsx", "mdx"],
  images: {
    domains: ["images.unsplash.com"],
  },
  swcMinify: true,
  experimental: {
    turbo: {},
    // ppr: true, // TODO: activate later
    mdxRs: true,
    optimizePackageImports: ["@unprice/ui", "@unprice/trpc", "@unprice/auth", "@unprice/db"],
    instrumentationHook: process.env.NODE_ENV === "production",
  },
  /** We already do linting and typechecking as separate tasks in CI */
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  /**
   * This is a workaround to allow us to use inside api a path alias
   * TODO: remove when api is deployed as an app
   */
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "#": path.resolve(__dirname, "../../internal/api/src/"),
    }
    return config
  },
}

const withMDX = createMDX({
  // Add markdown plugins here, as desired
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
})

export default withMDX(nextConfig)

// TODO: try to use million
// export default MillionLint.next({
//   rsc: true,
//   filter: {
//     include: "**.{mtsx,mjsx,tsx,jsx}",
//   },
// })(withMDX()(nextConfig))

// TODO: https://www.flavienbonvin.com/reduce-next-js-bundle/
