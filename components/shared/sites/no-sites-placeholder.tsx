import BlurImage from "@/components/shared/blur-image"

export default function NoLinksPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-base-skin-200 bg-base-skin py-12">
      <h2 className="z-10 text-xl font-semibold text-base-text">
        {"You don't have any projects yet!"}
      </h2>
      <BlurImage
        src="/_static/illustrations/call-waiting.svg"
        alt="No links yet"
        width={400}
        height={400}
        className="pointer-events-none -my-8"
      />
    </div>
  )
}
