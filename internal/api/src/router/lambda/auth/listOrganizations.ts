import { protectedProcedure } from "#trpc"

export const listOrganizations = protectedProcedure.query(async (opts) => {
  const userId = opts.ctx.userId

  const memberships = await opts.ctx.db.query.members.findMany({
    with: {
      workspace: {
        columns: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          isPersonal: true,
        },
      },
    },
    where: (members, operators) => operators.eq(members.userId, userId),
    orderBy: (members) => members.createdAtM,
  })

  return memberships.map((members) => ({
    id: members.workspace.id,
    slug: members.workspace.slug,
    name: members.workspace.name,
    image: members.workspace.imageUrl,
  }))
})
