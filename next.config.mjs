/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Recommended for the `pages` directory, default in `app`.
  // swcMinify: true,
  experimental: {
    appDir: true,
  },
  images: {
    domains: [
      "www.google.com",
      "avatar.vercel.sh",
      "faisalman.github.io",
      "avatars.dicebear.com",
      "res.cloudinary.com",
      "pbs.twimg.com",
      "github.com",
    ],
  },
}

export default nextConfig
