export function Ping() {
  return (
    <span className="flex h-[5px] w-[5px]">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
      <span className="relative inline-flex h-[5px] w-[5px] rounded-full bg-primary"></span>
    </span>
  )
}
