import GitHub from "@auth/core/providers/github"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import type { NextAuthConfig } from "next-auth"

import { db, eq, prepared, schema, tableCreator, utils } from "@builderai/db"
import type { WorkspacesJWTPayload } from "@builderai/validators/workspace"

const useSecureCookies = process.env.VERCEL_ENV === "production"

export const authConfig = {
  session: {
    strategy: "jwt",
    updateAge: 24 * 60 * 60, // 24 hours for update session
    maxAge: 2592000, // 30 days for expiration
  },
  useSecureCookies,
  // TODO: support redirect proxy
  // redirectProxyUrl: process.env.NEXTAUTH_REDIRECT_PROXY_URL,
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/auth/new-user",
  },
  events: {
    createUser: async ({ user }) => {
      const { id, name, image } = user

      if (!id) throw "Id not provided when trying to create user"

      const userData = await db.query.users.findFirst({
        columns: {
          id: true,
        },
        where: (user, { eq }) => eq(user.id, id),
      })

      if (!userData?.id) {
        throw "User not found"
      }

      const slug = utils.generateSlug(2)
      const workspaceId = utils.newIdEdge("workspace")

      // TODO: support invitation

      // create the workspace for the workspace and then add it as a member
      await db.transaction(async (db) => {
        const workspace = await db
          .insert(schema.workspaces)
          .values({
            id: workspaceId,
            tenantId: id,
            slug: slug,
            name: name ?? slug,
            imageUrl: image,
            isPersonal: true,
          })
          .onConflictDoUpdate({
            target: schema.workspaces.id,
            set: {
              tenantId: id,
              isPersonal: true,
            },
            where: eq(schema.workspaces.id, workspaceId),
          })
          .returning()
          .then((workspace) => workspace[0] ?? null)

        if (!workspace?.id) {
          db.rollback()
          throw "Error creating workspace"
        }

        const memberShip = await db
          .insert(schema.members)
          .values({
            userId: id,
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
    },
  },
  debug: false,
  // debug: process.env.NODE_ENV === "development",
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

      // we get the workspaces for the user and add it to the token so it can be used in the session
      // this is used to avoid fetching the workspaces for the user in every request
      // we use prepared statements to improve performance
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

      token.id = userId
      token.workspaces = workspaces ? workspaces : []

      return token
    },
  },
} satisfies NextAuthConfig
