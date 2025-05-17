import { signIn } from "@unprice/auth/server"
import { APP_DOMAIN } from "@unprice/config"
import { Button } from "@unprice/ui/button"
import { Google } from "@unprice/ui/icons"
import { cn } from "@unprice/ui/utils"

export function SignInGoogle({ className }: { className?: string }) {
  return (
    <form className={cn("w-full", className)}>
      <Button
        className="w-full"
        formAction={async () => {
          "use server"
          await signIn("google", {
            redirect: true,
            redirectTo: APP_DOMAIN,
          })
        }}
      >
        <Google className="mr-2 size-4" />
        Google
      </Button>
    </form>
  )
}
