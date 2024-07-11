import { Preview } from "./viewport/preview"

export function EditorPreview({
  data,
}: {
  data: string
}) {
  return (
    <div className="flex h-screen w-full flex-col">
      {/* <Editor enabled={false} resolver={{ TextComponent, ContainerElement, Novel }}>
        <Frame data={data} />
      </Editor> */}
      <Preview data={data} />
    </div>
  )
}
