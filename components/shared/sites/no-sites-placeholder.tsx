import BlurImage from "@/components/shared/blur-image"
import { Card } from "@/components/shared/card"

export default function NoSitesPlaceholder() {
  return (
    <Card>
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="z-10 text-xl font-semibold text-base-text">
          {"You don't have any sites yet!"}
        </h2>
        <BlurImage
          src="/_static/illustrations/call-waiting.svg"
          alt="No links yet"
          width={400}
          height={400}
          className="pointer-events-none -my-8"
        />
      </div>
      {/* TODO: create button site */}
    </Card>
  )
}
