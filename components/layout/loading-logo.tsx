import { Logo } from "@/components/layout/logo"

export function LoadingLogo() {
  return (
    <div className="flex h-screen w-screen animate-pulse items-center justify-center space-x-2">
      <Logo className="h-10 w-10" />
    </div>
  )
}
