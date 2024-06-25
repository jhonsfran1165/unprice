import { Button } from "@builderai/ui/button"
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@builderai/ui/drawer"
import { MoreVertical } from "lucide-react"

export default function MobileSidebar({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          aria-label="open sidebar"
          className="group flex items-center rounded-md p-2 text-sm font-medium"
        >
          <MoreVertical className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="w-full">
        <div className="p-4 pb-0">
          <div className="flex flex-col items-center space-x-2">
            <DrawerHeader className="w-full">
              <DrawerTitle>Menu</DrawerTitle>
              <DrawerDescription>
                <span className="text-muted-foreground">Quick access to</span>
              </DrawerDescription>
            </DrawerHeader>
            <DrawerBody className="w-full">{children}</DrawerBody>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
