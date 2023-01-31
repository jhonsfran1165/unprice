import { fetchCategories } from "@/lib/getCategories"
import { TabGroup } from "@/components/shared/tab-group"
import { Separator } from "@/components/ui/separator"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const categories = await fetchCategories()
  return (
    <div className="space-y-9">
      <div className="flex justify-between">
        <TabGroup
          path="/dashboard/context"
          items={[
            {
              text: "Home",
            },
            ...categories.map((x) => ({
              text: x.name,
              slug: x.slug,
            })),
          ]}
        />
      </div>
      <Separator className="mb-4" />
      <div>{children}</div>
    </div>
  )
}
