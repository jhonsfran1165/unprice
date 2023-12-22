import { Button } from "@builderai/ui/button"
import { Add } from "@builderai/ui/icons"
import { ScrollArea } from "@builderai/ui/scroll-area"
import { Separator } from "@builderai/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@builderai/ui/tabs"

import { userCanAccessProject } from "~/lib/project-guard"
import { FeatureGroupEmptyPlaceholder } from "../../_components/feature-group-place-holder"
import { Features, features } from "../../_components/features"

export const runtime = "edge"
export const preferredRegion = ["fra1"]

export default async function DashboardPage(props: {
  params: { workspaceSlug: string; projectSlug: string; planId: string }
}) {
  const { projectSlug, workspaceSlug, planId } = props.params

  await userCanAccessProject({
    projectSlug,
    needsToBeInTier: ["PRO", "STANDARD", "FREE"],
  })

  return (
    <div className="bg-background">
      <div className="grid lg:grid-cols-5">
        <Features features={features} className="hidden lg:block" />
        <div className="col-span-3 lg:col-span-4 lg:border-l">
          <div className="h-full px-4 py-6 lg:px-8">
            <Tabs defaultValue="music" className="h-full space-y-6">
              <div className="space-between flex items-center">
                <TabsList>
                  <TabsTrigger value="music" className="relative">
                    Music
                  </TabsTrigger>
                  <TabsTrigger value="podcasts">Podcasts</TabsTrigger>
                  <TabsTrigger value="live" disabled>
                    Live
                  </TabsTrigger>
                </TabsList>
                <div className="ml-auto mr-4">
                  <Button>
                    <Add className="mr-2 h-4 w-4" />
                    Add music
                  </Button>
                </div>
              </div>
              <TabsContent
                value="music"
                className="border-none p-0 outline-none"
              >
                <ScrollArea>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-semibold tracking-tight">
                        Listen Now
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Top picks for you. Updated daily.
                      </p>
                    </div>
                  </div>
                  <Separator className="my-4" />

                  <div className="mt-6 space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">
                      Made for You
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Your personal playlists. Updated daily.
                    </p>
                  </div>
                  <Separator className="my-4" />
                </ScrollArea>
              </TabsContent>
              <TabsContent
                value="podcasts"
                className="h-full flex-col border-none p-0 data-[state=active]:flex"
              >
                <ScrollArea>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-semibold tracking-tight">
                        New Episodes
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Your favorite podcasts. Updated daily.
                      </p>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <FeatureGroupEmptyPlaceholder />
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
