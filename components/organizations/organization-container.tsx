import { OrganizationForm } from "@/components/organizations/organization-form"
import BlurImage from "@/components/shared/blur-image"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"

export function OrganizationContainer() {
  return (
    <MaxWidthWrapper className="pt-10">
      <div className="grid gap-20 md:grid-cols-[250px_1fr]">
        <div className="md:flex md:w-[250px]">
          <div className="flex flex-col items-center">
            <BlurImage
              src="/_static/illustrations/undraw_folder_re_apfp.svg"
              alt="No links yet"
              width={250}
              height={250}
              priority={true}
              className="pointer-events-none mb-10 mt-5"
            />
            <h2 className="text-base-text z-10 text-xl font-semibold">
              {"Create a new organization"}
            </h2>
            <br />
            <p className="p-5 text-justify text-sm md:p-0">
              Organizations are a set of users where you can use to create new
              projects, they are separated from orther organizations. Billings,
              projects and settings are totally independet.
            </p>
          </div>
        </div>
        <OrganizationForm />
      </div>
    </MaxWidthWrapper>
  )
}
