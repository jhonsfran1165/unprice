import { signOut } from "@unprice/auth/server"
import { Button } from "@unprice/ui/button"

import { AUTH_ROUTES } from "@unprice/config"

export default function AuthenticationPage() {
  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="font-semibold text-2xl tracking-tight">Sign Out</h1>
        <p className="text-muted-foreground text-sm">Are you sure you want to sign out?</p>
        <form>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="bg-background"
              formAction={async () => {
                "use server"
                await signOut({
                  redirect: true,
                  redirectTo: AUTH_ROUTES.SIGNIN,
                })
              }}
            >
              Confirm
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
