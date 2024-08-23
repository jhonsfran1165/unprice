import { LoadingAnimation } from "@unprice/ui/loading-animation"

export default function LayoutLoader() {
  return (
    <div className="flex h-[calc(100vh-7rem)] items-center justify-center">
      <LoadingAnimation />
    </div>
  )
}
