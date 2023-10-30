import { Button } from "@builderai/ui/button"

import HeaderSubTab from "~/components/header-subtab"
import ApiKeysSkeleton from "./data-table-skeleton"

export default function ApiKeysLoading() {
  return (
    <>
      <HeaderSubTab
        title="Api keys generated"
        description="All the apis of the system"
        action={<Button className="button-primary">Create API Key</Button>}
      />

      <ApiKeysSkeleton />
    </>
  )
}
