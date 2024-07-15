import { Preview } from "./viewport/preview"

export function EditorPreview({
  data,
}: {
  data: string
}) {
  return (
    <div className="flex h-screen w-full flex-col">
      <Preview data={data} />
    </div>
  )
}
