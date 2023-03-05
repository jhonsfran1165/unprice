import Link from "next/link"

import type { Site } from "@/lib/types/supabase"
import { Icons } from "@/components/shared/icons"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export const SiteCard = ({ site }: { site: Site }) => {
  return (
    <div
      key={site.id}
      className={"rounded-2xl border border-base-skin-200 bg-base-skin-900 p-4"}
    >
      <div className="space-y-3">
        <div className="flex items-center space-x-1">
          <div className="flex-1">
            <div className="flex items-center justify-start space-x-3 px-1">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src="https://github.com/shadcn.png"
                  alt="@shadcn"
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <span className="block truncate text-sm font-bold text-base-text">
                {site.name}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            className="flex items-center justify-center text-base p-2 hover:bg-base-text-200"
          >
            <Link href={`/site/${site.id}`}>
              <span className="flex pointer-events-none items-center justify-center">
                <Icons.externalLink
                  className="h-4 w-4 text-base-text-200"
                  aria-hidden="true"
                />
              </span>
            </Link>
          </Button>
        </div>
        <div className={"h-3 w-11/12 pb-4"}>
          <div className={"font-semibold text-sm pl-4"}>{site.subdomain}</div>
        </div>
      </div>
    </div>
  )
}
