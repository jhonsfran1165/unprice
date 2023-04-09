import { Icons } from "@/components/shared/icons"

export const ExternalLink = ({
  children,
  href,
}: {
  children: React.ReactNode
  href: string
}) => {
  return (
    <a
      href={href}
      className="bg-gray-700 text-gray-100 hover:bg-gray-500 inline-flex gap-x-2 rounded-lg px-3 py-1 text-sm font-medium hover:text-white"
    >
      <div>{children}</div>

      <Icons.externalLink className="block w-4" />
    </a>
  )
}
