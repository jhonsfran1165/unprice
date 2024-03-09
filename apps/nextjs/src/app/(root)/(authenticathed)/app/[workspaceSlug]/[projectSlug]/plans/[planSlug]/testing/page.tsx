import { cookies } from "next/headers"

import DragDrop from "./components/drag-drop"
import { PlanVersionConfigurator } from "./components/plan-version-configurator"

const defaultFeatures = [
  {
    id: Math.random().toString(),
    slug: "slug",
    title: "asdasdasd",
    description: "description",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: Math.random().toString(),
    slug: "slug",
    title: "asdasdasd",
    description: "description",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: Math.random().toString(),
    slug: "slug",
    title: "asdasdasd",
    description: "description",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: Math.random().toString(),
    slug: "slug",
    title: "asdasdasd",
    description: "description",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: Math.random().toString(),
    slug: "slug",
    title: "asdasdasd",
    description: "description",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: Math.random().toString(),
    slug: "slug",
    title: "asdasdasd",
    description: "description",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: Math.random().toString(),
    slug: "slug",
    title: "asdasdasd",
    description: "description",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: Math.random().toString(),
    slug: "slug",
    title: "asdasdasd",
    description: "description",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: Math.random().toString(),
    slug: "slug",
    title: "asdasdasd",
    description: "description",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: Math.random().toString(),
    slug: "slug",
    title: "asdasdasd",
    description: "description",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: Math.random().toString(),
    slug: "slug",
    title: "asdasdasd",
    description: "description",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: Math.random().toString(),
    slug: "slug",
    title: "asdasdasd",
    description: "description",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: Math.random().toString(),
    slug: "slug",
    title: "asdasdasd",
    description: "description",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export default function MailPage() {
  const layout = cookies().get("react-resizable-panels:layout")
  const collapsed = cookies().get("react-resizable-panels:collapsed")

  // TODO: fix this
  // const defaultLayout = layout ? JSON.parse(layout.value ?? 0) : undefined
  // const defaultCollapsed = collapsed
  //   ? JSON.parse(collapsed.value ?? 0)
  //   : undefined

  return (
    <>
      <div className="flex flex-col">
        <DragDrop projectSlug="projectSlug">
          <PlanVersionConfigurator
            // features={accounts} // initial features
            // planVersionFeatures={mails}
            features={defaultFeatures}
            defaultLayout={undefined}
          />
        </DragDrop>
      </div>
    </>
  )
}
