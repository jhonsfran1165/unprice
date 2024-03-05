import GitHub from "@auth/core/providers/github"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import type { NextAuthConfig } from "next-auth"

import { and, db, eq, prepared, sql, tableCreator } from "@builderai/db"
import * as schema from "@builderai/db/schema"
import * as utils from "@builderai/db/utils"
import type { WorkspacesJWTPayload } from "@builderai/db/validators"

const useSecureCookies = process.env.VERCEL_ENV === "production"

export const authConfig = {
  trustHost:
    Boolean(process.env.VERCEL) || process.env.NODE_ENV === "development",
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
    ...DrizzleAdapter(db, tableCreator),

    // override the default create user
    async createUser(data) {
      const user = await db
        .insert(schema.users)
        .values(data)
        .returning()
        .then((user) => user[0] ?? null)

      if (!user) {
        throw "Error creating user"
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
            acceptedAt: new Date(),
          })
          .where(
            and(
              eq(schema.invites.email, inviteUser.email),
              eq(schema.invites.workspaceId, inviteUser.workspaceId)
            )
          )
      }

      // create the workspace for the user and then add it as a member
      await db.transaction(async (db) => {
        const slug = utils.generateSlug(2)
        const workspaceId = utils.newIdEdge("workspace")

        const workspace = await db
          .insert(schema.workspaces)
          .values({
            id: workspaceId,
            slug: slug,
            name: user.name ?? slug,
            imageUrl: user.image,
            isPersonal: true,
            createdBy: user.id,
          })
          .onConflictDoNothing()
          .returning()
          .then((workspace) => workspace[0] ?? null)

        if (!workspace?.id) {
          db.rollback()
          throw "Error creating workspace"
        }

        const memberShip = await db
          .insert(schema.members)
          .values({
            userId: user.id,
            workspaceId: workspaceId,
            role: "OWNER",
          })
          .onConflictDoNothing()
          .returning()
          .then((members) => members[0] ?? null)

        if (!memberShip?.userId) {
          db.rollback()
          throw "Error creating member"
        }
      })

      return user
    },
  },
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_CLIENT_ID,
      clientSecret: process.env.AUTH_GITHUB_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    // authorized({ auth }) {
    //   return !!auth?.user // this ensures there is a logged in user for -every- request
    // },
    session: (opts) => {
      const token = opts.token
      const session = opts.session

      if (token.sub && session.user) {
        session.user.id = token.sub
        session.user.workspaces = token.workspaces as WorkspacesJWTPayload[]
      }

      return session
    },
    jwt: async (opts) => {
      const token = opts.token
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

        // refresh the workspaces if the time is greater than the refreshWorkspacesAt
        if (token.workspaces && tokenDate > new Date()) {
          return token
        }

        const userWithWorkspaces =
          await prepared.workspacesByUserPrepared.execute({
            userId,
          })

        const workspaces = userWithWorkspaces?.members.map((member) => ({
          id: member.workspace.id,
          slug: member.workspace.slug,
          role: member.role,
          isPersonal: member.workspace.isPersonal,
          plan: member.workspace.plan,
        }))

        token.workspaces = workspaces ? workspaces : []

        // if we want to invalidate the token we can set the refreshWorkspacesAt to 0 from the server
        token.refreshWorkspacesAt = Date.now() + 3600000 // 1 hour
      } catch (error) {
        console.error(error)
        token.refreshWorkspacesAt = 0 // invalidate the token if there is an error
        token.workspaces = [] // invalidate the token if there is an error
        throw "Error getting workspaces for user"
      }

      return token
    },
  },
} satisfies NextAuthConfig
