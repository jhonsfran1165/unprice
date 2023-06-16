import { ProjectsContainer } from "@/components/projects/project-container"

export default async function OrgIndexPage({ params }: { params }) {
  return <ProjectsContainer loading={false} />
}
