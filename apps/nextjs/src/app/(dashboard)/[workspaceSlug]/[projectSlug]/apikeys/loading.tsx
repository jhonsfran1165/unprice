import HeaderSubTab from "~/components/header-subtab"
import { DataTable } from "./data-table"
import { NewApiKeyDialog } from "./new-api-key-dialog"

export default function ApiKeysLoading() {
  return (
    <>
      <HeaderSubTab
        title="Api keys generated"
        description="All the apis of the system"
        action={<NewApiKeyDialog projectSlug={""} />}
      />

      {/* TODO: create loading state */}
      <DataTable data={[]} projectSlug={""} />
    </>
  )
}
