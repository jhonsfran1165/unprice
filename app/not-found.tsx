import Link from "next/link"

export default function NotFound() {
  return (
    <Link
      href="/dashboard"
      className="relative inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-4 py-2  text-sm font-medium text-brand-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
    >
      Go to Dashboard
    </Link>
  )
}
