import { createTRPCRouter } from "#trpc"
import { changeRoleMember } from "./changeRoleMember"
import { create } from "./create"
import { deleteWorkspace } from "./delete"
import { deleteInvite } from "./deleteInvite"
import { deleteMember } from "./deleteMember"
import { getBySlug } from "./getBySlug"
import { inviteMember } from "./inviteMember"
import { listInvitesByActiveWorkspace } from "./listInvitesByActiveWorkspace"
import { listMembersByActiveWorkspace } from "./listMembersByActiveWorkspace"
import { listWorkspacesByActiveUser } from "./listWorkspacesByActiveUser"
import { rename } from "./rename"
import { signUp } from "./signUp"

export const workspaceRouter = createTRPCRouter({
  create: create,
  signUp: signUp,
  deleteMember: deleteMember,
  listMembersByActiveWorkspace: listMembersByActiveWorkspace,
  getBySlug: getBySlug,
  delete: deleteWorkspace,
  listWorkspacesByActiveUser: listWorkspacesByActiveUser,
  rename: rename,
  changeRoleMember: changeRoleMember,
  listInvitesByActiveWorkspace: listInvitesByActiveWorkspace,
  deleteInvite: deleteInvite,
  inviteMember: inviteMember,
})
