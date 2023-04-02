import { ProjectsContainer } from "@/components/projects/project-container"

// TODO: introduce example framer motion
// https://www.josephcollicoat.com/articles/animating-text-with-the-intersection-observer-api-and-framer-motion

export default async function OrgIndexPage({ params }: { params }) {
  return <ProjectsContainer loading={false} />
}
