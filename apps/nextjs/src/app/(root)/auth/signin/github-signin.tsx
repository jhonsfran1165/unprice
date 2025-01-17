import { signIn } from "@unprice/auth/server"
import { APP_DOMAIN } from "@unprice/config"
import { Button } from "@unprice/ui/button"
import { GitHub } from "@unprice/ui/icons"

export function SignInGithub() {
  return (
    <form>
      <div className="flex flex-col gap-2">
        <Button
          formAction={async () => {
            "use server"
            await signIn("github", {
              redirect: true,
              redirectTo: APP_DOMAIN,
            })
          }}
        >
          <GitHub className="mr-2 h-5 w-5" />
          Github
        </Button>
      </div>
    </form>
  )
}
