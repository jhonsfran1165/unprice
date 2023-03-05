import { cn } from "@/lib/utils"

export const DashboardShellSkeleton = () => (
  <div
    className={
      "group relative h-36 rounded-lg border bg-base-skin p-6 text-base-text shadow-md transition-shadow hover:shadow-lg border-base-skin-200 animate-pulse"
    }
  >
    <div className="flex flex-col justify-between space-y-4">
      <div className="space-y-2 [&>p]:text-slate-600 [&>p]:dark:text-slate-300 [&>h4]:!mt-0 [&>h3]:!mt-0 animate-pulse"></div>
    </div>
  </div>
)
