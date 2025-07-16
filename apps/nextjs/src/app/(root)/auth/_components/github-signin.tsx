import { signIn } from "@unprice/auth/server"
import { Button } from "@unprice/ui/button"
import { GitHub } from "@unprice/ui/icons"
import { cn } from "@unprice/ui/utils"

export function SignInGithub({ className }: { className?: string }) {
  return (
    <form className={cn("w-full", className)}>
      <Button
        className="w-full"
        variant="default"
        formAction={async () => {
          "use server"
          await signIn("github", {
            redirect: true,
          })
        }}
      >
        <GitHub className="mr-2 size-4" />
        Github
      </Button>
    </form>
  )
}
