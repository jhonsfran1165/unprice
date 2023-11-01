// import { Button } from "@builderai/ui/button"
// import { Dialog, DialogContent, DialogTrigger } from "@builderai/ui/dialog"

import { DashboardShell } from "~/components/dashboard-shell"

// import { InviteMemberForm } from "./_components/invite-member-dialog"

// TODO: find a way to add invite member button without adding too much bundle to the layout
export default function WorkspaceLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string }
}) {
  return (
    <DashboardShell
      title="General Settings"
      module="workspace"
      submodule="settings"
      // action={
      //   <Dialog>
      //     <DialogTrigger asChild>
      //       <Button className="self-end">Invite member</Button>
      //     </DialogTrigger>
      //     <DialogContent>
      //       <InviteMemberForm />
      //     </DialogContent>
      //   </Dialog>
      // }
    >
      {props.children}
    </DashboardShell>
  )
}
