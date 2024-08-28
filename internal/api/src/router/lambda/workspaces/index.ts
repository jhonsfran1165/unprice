import { createTRPCRouter } from "../../../trpc"
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
  create,
  signUp,
  deleteMember,
  listMembersByActiveWorkspace,
  getBySlug,
  delete: deleteWorkspace,
  listWorkspacesByActiveUser,
  rename,
  changeRoleMember,
  listInvitesByActiveWorkspace,
  deleteInvite,
  inviteMember,
})
