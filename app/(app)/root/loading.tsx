import { Logo } from "@/components/layout/logo"

// TODO: use framer motion https://www.youtube.com/watch?v=BtsVMvds3P0&ab_channel=WrongAkram
export default function LoadingPage() {
  return (
    <div className="flex h-screen w-screen animate-pulse items-center justify-center space-x-2">
      <Logo className="h-10 w-auto text-2xl" />
    </div>
  )
}
