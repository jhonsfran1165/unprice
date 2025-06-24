import { Button } from "@unprice/ui/button"
import { notFound } from "next/navigation"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import PageBuilderConfig from "~/components/pager/builder"
import { api } from "~/trpc/server"

export default async function PageEditor({
  params: { pageId },
}: {
  params: { workspaceSlug: string; projectSlug: string; pageId: string }
}) {
  const { page } = await api.pages.getById({
    id: pageId,
  })

  if (!page) {
    notFound()
  }

  return (
    <DashboardShell
      header={
        <HeaderTab
          title={page.title}
          description={page.description}
          label={page.published ? "published" : "draft"}
          id={pageId}
          action={
            <div className="flex items-center gap-2">
              <Button variant={"ghost"}>API</Button>
            </div>
          }
        />
      }
    >
      <PageBuilderConfig page={page} />
    </DashboardShell>
    // <EditorPageComponent
    //   page={rest}
    //   data={data}
    //   breadcrumbs={
    //     <div className="px-4 md:px-6">
    //       <BreadcrumbsApp breadcrumbs={[projectSlug, "pages", pageId]} baseUrl={baseUrl} />
    //     </div>
    //   }
    //   sidebar={
    //     <ElementsSidebar>
    //       <div className="flex flex-1 items-end justify-center">
    //         <UserProfileMobile />
    //       </div>
    //     </ElementsSidebar>
    //   }
    // />
  )
}
