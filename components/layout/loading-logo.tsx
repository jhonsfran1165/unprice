import { Logo } from "@/components/layout/logo"

export function LoadingLogo() {
  return (
    <div className="flex h-screen w-screen items-center justify-center animate-pulse space-x-2">
      <Logo />
    </div>
  )
}
