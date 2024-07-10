import BreadcrumbsApp from "~/components/layout/breadcrumbs"
import { UserProfileMobile } from "~/components/navigation/user-nav"
import { EditorPageComponent } from "~/components/page-builder/editor"
import { ElementsSidebar } from "~/components/page-builder/viewport/elements-sidebar"

export default function PageEditor({
  params: { workspaceSlug, projectSlug, page },
}: {
  params: { workspaceSlug: string; projectSlug: string; page: string }
}) {
  const baseUrl = `/${workspaceSlug}`

  return (
    <EditorPageComponent
      breadcrumbs={
        <div className="px-4 md:px-6">
          <BreadcrumbsApp breadcrumbs={[projectSlug, "pages", page]} baseUrl={baseUrl} />
        </div>
      }
      sidebar={
        <ElementsSidebar>
          <div className="flex flex-1 items-end justify-center">
            <UserProfileMobile />
          </div>
        </ElementsSidebar>
      }
    />
  )
}
