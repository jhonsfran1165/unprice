import { Auth } from "@auth/core"
import Github from "@auth/core/providers/github"
import { eventHandler, toWebRequest } from "h3"

export default eventHandler((event) =>
  Auth(toWebRequest(event), {
    secret: process.env.AUTH_SECRET,
    trustHost: Boolean(process.env.VERCEL) || process.env.NODE_ENV === "development",
    redirectProxyUrl: process.env.AUTH_REDIRECT_PROXY_URL,
    basePath: "/auth",
    providers: [
      Github({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET,
        profile: (p) => ({
          id: p.id.toString(),
          email: p.email,
          name: p.login,
          image: p.avatar_url,
        }),
      }),
    ],
  })
)
