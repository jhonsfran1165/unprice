import type { SerializedNode, SerializedNodes } from "@craftjs/core"
import { ContainerElementPreview } from "../components/container/container-preview"
import { NovelPreview } from "../components/novel/novel-preview"
import { TextComponentPreview } from "../components/text/text-preview"

import { serialize } from "next-mdx-remote/serialize";

export const Preview = ({
  data,
}: {
  data: string
}) => {
  // serialize data to JSON
  const serializedData = JSON.parse(data) as SerializedNodes

  return (
    <div className="flex h-screen flex-col">
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
      return <ContainerElementPreview {...node.props}>{Children}</ContainerElementPreview>
    case "TextComponent":
      return <TextComponentPreview {...node.props} />
    case "Novel": {

      const mdxSource = await serialize(node.props.markdown ?? "");
      return <NovelPreview mdxSource={mdxSource} />
    }
    default:
      return null
  }
}
