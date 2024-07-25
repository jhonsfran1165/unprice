import "@unprice/api/env"
import "@unprice/auth/env"
import "@unprice/stripe/env"
import "./src/env.mjs"

// import MillionLint from "@million/lint"
import createMDX from "@next/mdx"

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  /** Enables hot reloading for local packages without a build step */
  transpilePackages: [
    "@unprice/api",
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
  // swcMinify: true,
  experimental: {
    ppr: true,
    mdxRs: true,
    optimizePackageImports: ["@unprice/ui", "@unprice/api", "@unprice/auth", "@unprice/db"],
    instrumentationHook: process.env.NODE_ENV === "production",
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.ignoreWarnings = [{ module: /opentelemetry/ }]
    }
    return config
  },
  /** We already do linting and typechecking as separate tasks in CI */
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
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
