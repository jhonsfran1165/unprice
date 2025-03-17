import GitHub from "@auth/core/providers/github"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import type { NextAuthConfig } from "next-auth"

import { and, eq, sql } from "@unprice/db"
import { createWorkspacesByUserQuery } from "@unprice/db/queries"
import * as schema from "@unprice/db/schema"
import * as utils from "@unprice/db/utils"
import type { WorkspacesJWTPayload } from "@unprice/db/validators"
import { db } from "./db"

const useSecureCookies = process.env.VERCEL_ENV === "production"
const log = console // TODO: create a logger for this

export const authConfig: NextAuthConfig = {
  trustHost: Boolean(process.env.VERCEL) || process.env.NODE_ENV === "development",
  logger: {
    debug: (message, metadata) => log.debug(message, { metadata }),
    error: (error) => log.error(error),
    warn: (message) => {
      if (message.includes("experimental-webauthn")) {
        // don't spam the console with this
        return
      }
      log.warn(message)
    },
  },
  redirectProxyUrl: process.env.AUTH_REDIRECT_PROXY_URL,
  session: {
    strategy: "jwt",
    updateAge: 24 * 60 * 60, // 24 hours for update session
    maxAge: 2592000, // 30 days for expiration
  },
  useSecureCookies,
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/auth/new-user",
  },
  events: {
    // createUser: async ({ user }) => {
    //   // send email to user
    // },
  },
  debug: process.env.NODE_ENV === "development",
  adapter: {
    ...DrizzleAdapter(db.$primary, {
      usersTable: schema.users,
      accountsTable: schema.accounts,
      sessionsTable: schema.sessions,
      verificationTokensTable: schema.verificationTokens,
    }),

    // override the default create user
    async createUser(data) {
      const user = await db
        .insert(schema.users)
        .values({
          ...data,
          // use our own id generator
          id: utils.newId("user"),
          // only true if we use auth providers like github, google, etc
          emailVerified: new Date(),
        })
        .returning()
        .then((user) => user[0] ?? null)

      if (!user) {
        throw `Error creating user for ${data.email}`
      }

      const inviteUser = await db.query.invites.findFirst({
        where: (invite, { eq, and }) =>
          and(eq(invite.email, user.email), eq(invite.acceptedAt, sql`NULL`)),
      })

      if (inviteUser) {
        // add the user as a member of the workspace
        await db
          .insert(schema.members)
          .values({
            userId: user.id,
            workspaceId: inviteUser.workspaceId,
            role: inviteUser.role,
          })
          .onConflictDoNothing()

        // update the invite as accepted
        await db
          .update(schema.invites)
          .set({
            acceptedAt: Date.now(),
          })
          .where(
            and(
              eq(schema.invites.email, inviteUser.email),
              eq(schema.invites.workspaceId, inviteUser.workspaceId)
            )
          )
      }

      return user
    },
  },
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_CLIENT_ID,
      clientSecret: process.env.AUTH_GITHUB_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    // authorized({ auth }) {
    //   return !!auth?.user // this ensures there is a logged in user for -every- request
    // },
    session: (opts) => {
      const token = opts.token
      const session = opts.session

      if (token.sub) {
        session.user.id = token.sub
      }

      if (session.user) {
        session.user.workspaces = token.workspaces as WorkspacesJWTPayload[]
      }

      return session
    },
    jwt: async (opts) => {
      const token = opts.token
      const trigger = opts.trigger
      const userId = token.sub

      if (!userId) return token
      token.id = userId

      // set a parameter that allows to refresh workspace data every hour
      // this is used to avoid fetching the workspaces for the user in every request
      // we use prepared statements to improve performance
      if (!token.refreshWorkspacesAt) {
        token.refreshWorkspacesAt = 0
      }

      // we get the workspaces for the user and add it to the token so it can be used in the session
      // this is used to avoid fetching the workspaces for the user in every request
      // we use prepared statements to improve performance
      try {
        const tokenDate = new Date(token.refreshWorkspacesAt as number)

        // return if the token is still valid
        // we need to refresh the workspaces if the trigger is update
        if (token.workspaces && tokenDate > new Date() && trigger !== "update") {
          return token
        }

        const userWithWorkspaces = await createWorkspacesByUserQuery(db).execute({
          userId,
        })

        // filter out the workspaces that are not enabled
        const workspaces = userWithWorkspaces?.members
          .filter((member) => member.workspace.enabled)
          .map((member) => ({
            id: member.workspace.id,
            slug: member.workspace.slug,
            role: member.role,
            isPersonal: member.workspace.isPersonal,
            enabled: member.workspace.enabled,
            unPriceCustomerId: member.workspace.unPriceCustomerId,
            isInternal: member.workspace.isInternal,
            isMain: member.workspace.isMain,
          }))

        token.workspaces = workspaces ? workspaces : []

        token.refreshWorkspacesAt = Date.now() + 3600000 // revalidate the token in 1 hour
      } catch (error) {
        token.refreshWorkspacesAt = 0 // invalidate the token if there is an error
        token.workspaces = [] // invalidate the token if there is an error
        log.error("Error getting workspaces for user", { error })
        throw "Error getting workspaces for user"
      }

      return token
    },
  },
} satisfies NextAuthConfig
