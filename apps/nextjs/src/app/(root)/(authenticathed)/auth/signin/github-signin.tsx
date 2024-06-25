import { signIn } from "@builderai/auth/server"
import { Button } from "@builderai/ui/button"
import { GitHub } from "@builderai/ui/icons"

export function SignInGithub() {
  return (
    <form>
      <div className="flex flex-col gap-2">
        <Button
          formAction={async () => {
            "use server"
            await signIn("github", {
              redirect: true,
              redirectTo: "app.localhost:3000",
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
