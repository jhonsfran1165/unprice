export const ErrorMessage = ({
  isPreview,
  published,
}: { isPreview: boolean; published: boolean }) => {
  // invalid token
  if (!isPreview) {
    return (
      <main className="container mx-auto space-y-24 px-4 py-16">
        <div className="flex flex-col items-center justify-center">
          <h1 className="font-bold text-4xl">Preview mode is not active</h1>
          <p className="text-muted-foreground text-sm">
            The revalidate token is invalid. Please check the token from the dashboard and try
            again.
          </p>
        </div>
      </main>
    )
  }

  if (!published) {
    return (
      <main className="container mx-auto space-y-24 px-4 py-16">
        <div className="flex flex-col items-center justify-center">
          <h1 className="font-bold text-4xl">Site is not published</h1>
          <p className="text-muted-foreground text-sm">
            This site is not published yet. If the site is published, you can only access as preview
            from the dashboard.
          </p>
        </div>
      </main>
    )
  }

  return null
}
