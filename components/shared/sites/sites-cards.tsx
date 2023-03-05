import type { Site } from "@/lib/types/supabase"
import { cn } from "@/lib/utils"

export const SitesCard = ({ sites }: { sites: Site[] }) => {
  if (sites.length === 0 || !sites) {
    // TODO: use here component to create sites
    return null
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {sites.map((site) => (
          <div
            className={cn(
              "rounded-2xl border border-base-skin-200 bg-base-skin-900 p-4"
            )}
          >
            <div className="space-y-3">
              <div className={"h-14 rounded-lg bg-gray-700"}>{site.name}</div>
              <div className={"h-3 w-11/12 rounded-lg bg-gray-70"}>
                {site.name}
              </div>
              <div className={"h-3 w-8/12 rounded-lg bg-gray-700"}>
                {site.name}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
