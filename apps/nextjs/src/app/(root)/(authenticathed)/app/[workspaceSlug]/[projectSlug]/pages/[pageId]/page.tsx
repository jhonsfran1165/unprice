import lz from "lzutf8"
import { notFound } from "next/navigation"
import BreadcrumbsApp from "~/components/layout/breadcrumbs"
import { UserProfileMobile } from "~/components/navigation/user-nav"
import { EditorPageComponent } from "~/components/page-builder/editor"
import { ElementsSidebar } from "~/components/page-builder/viewport/elements-sidebar"
import { api } from "~/trpc/server"

export default async function PageEditor({
  params: { workspaceSlug, projectSlug, pageId },
}: {
  params: { workspaceSlug: string; projectSlug: string; pageId: string }
}) {
  const baseUrl = `/${workspaceSlug}`

  const { page } = await api.pages.getById({
    id: pageId,
  })

  if (!page) {
    notFound()
  }

  // convert to json string
  const data = lz.decompress(lz.decodeBase64(page.content ?? ""))

  return (
    <EditorPageComponent
      data={data}
      breadcrumbs={
        <div className="px-4 md:px-6">
          <BreadcrumbsApp breadcrumbs={[projectSlug, "pages", pageId]} baseUrl={baseUrl} />
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
