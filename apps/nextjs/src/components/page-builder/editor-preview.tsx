import type { SerializedNode, SerializedNodes } from "@craftjs/core"

import { ContainerElementPreview } from "./components/container/container-preview"
import { FooterPreview } from "./components/footer/footer-preview"
import { HeaderPreview } from "./components/header/header-preview"
import { NovelPreview } from "./components/novel/novel-preview"
import { PricingTablePreview } from "./components/pricing/pricing-table-preview"
import { TextComponentPreview } from "./components/text/text-preview"

// everything renders as RSC
export const EditorPreview = ({
  data,
}: {
  data: string
}) => {
  // serialize data to JSON
  const serializedData = JSON.parse(data) as SerializedNodes

  return (
    <div className="flex h-screen w-full flex-col">
      <NodePreview node={serializedData.ROOT!} data={serializedData} />
    </div>
  )
}

const NodePreview = async ({
  node,
  data,
}: {
  node: SerializedNode
  data: SerializedNodes
}) => {
  let typeName = ""

  if (typeof node.type === "object") {
    typeName = node.type.resolvedName as string
  } else {
    typeName = node.type
  }

  const Children = node.nodes.map((nodeId) => {
    return <NodePreview key={nodeId} node={data[nodeId]!} data={data} />
  })

  switch (typeName) {
    case "ContainerElement":
      return (
        <ContainerElementPreview {...node.props} isRoot={!node?.parent}>
          {Children}
        </ContainerElementPreview>
      )
    case "TextComponent":
      return <TextComponentPreview {...node.props} />
    case "NovelComponent":
      return <NovelPreview {...node.props} html={node.props.html} />
    case "HeaderComponent":
      return <HeaderPreview {...node.props} />
    case "PricingTableComponent":
      return <PricingTablePreview {...node.props} />
    case "FooterComponent":
      return <FooterPreview {...node.props} />
    default:
      return null
  }
}
