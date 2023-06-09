import { ProjectForm } from "@/components/projects/project-form"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"

export default function AddProject() {
  return (
    <MaxWidthWrapper className="pt-10">
      <div className="flex flex-row">
        <div className="w-full">
          <ProjectForm orgSlug="harold"/>
        </div>
      </div>
    </MaxWidthWrapper>
  )
}
