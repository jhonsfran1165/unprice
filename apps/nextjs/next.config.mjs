import "@builderai/api/env"
import "@builderai/stripe/env"
import "./src/env.mjs"

import withBundleAnalyzer from "@next/bundle-analyzer"
import withMDX from "@next/mdx"

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  /** Enables hot reloading for local packages without a build step */
  transpilePackages: [
    "@builderai/api",
    "@builderai/db",
    "@builderai/stripe",
    "@builderai/ui",
    "@builderai/auth",
    "@builderai/config",
  ],
  pageExtensions: ["ts", "tsx", "mdx"],
  images: {
    domains: ["images.unsplash.com"],
  },
  experimental: {
    mdxRs: true,
    serverActions: true,
    optimizePackageImports: ["@builderai/ui"],
  },
  swcMinify: true,
  /** We already do linting and typechecking as separate tasks in CI */
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
}

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(withMDX()(config))

// TODO: https://www.flavienbonvin.com/reduce-next-js-bundle/
