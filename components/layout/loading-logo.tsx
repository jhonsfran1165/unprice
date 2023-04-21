import { Logo } from "@/components/layout/logo"

export function LoadingLogo() {
  return (
    <div className="flex h-screen w-screen animate-pulse items-center justify-center space-x-2">
      <Logo className="h-10 w-auto text-2xl" />
    </div>
  )
}
