import { Auth } from "@auth/core"
import Credentials from "@auth/core/providers/credentials"
import Github from "@auth/core/providers/github"
import Google from "@auth/core/providers/google"
import { eventHandler, toWebRequest } from "h3"

import { env } from "../env"

export default eventHandler((event) =>
  Auth(toWebRequest(event), {
    secret: env.AUTH_SECRET,
    trustHost: Boolean(env.VERCEL_ENV) || env.NODE_ENV === "development",
    redirectProxyUrl: env.AUTH_REDIRECT_PROXY_URL,
    basePath: "/auth",
    providers: [
      Credentials({
        credentials: {
          password: { label: "Password", type: "password" },
          email: { label: "Email", type: "email" },
        },
      }),
      Github({
        clientId: env.AUTH_GITHUB_CLIENT_ID,
        clientSecret: env.AUTH_GITHUB_CLIENT_SECRET,
        profile: (p) => ({
          id: p.id.toString(),
          email: p.email,
          name: p.login,
          image: p.avatar_url,
        }),
      }),
      Google({
        clientId: env.AUTH_GOOGLE_CLIENT_ID,
        clientSecret: env.AUTH_GOOGLE_CLIENT_SECRET,
        profile: (p) => ({
          id: p.id.toString(),
          email: p.email,
          name: p.name,
          image: p.image,
        }),
      }),
    ],
  })
)
