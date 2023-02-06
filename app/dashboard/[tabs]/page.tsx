import LinkCardPlaceholder from "@/components/shared/link-card-placeholder"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"
import NoLinksPlaceholder from "@/components/shared/no-links-placeholder"

export default async function IndexPage() {
  return (
    <>
      <MaxWidthWrapper className="pt-10">
        <ul className="grid grid-cols-1 gap-3">
          <LinkCardPlaceholder></LinkCardPlaceholder>
          <NoLinksPlaceholder />
        </ul>
      </MaxWidthWrapper>
    </>
  )
}
