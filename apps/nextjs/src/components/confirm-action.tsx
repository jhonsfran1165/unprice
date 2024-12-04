import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@unprice/ui/alert-dialog"

// TODO: support close first modal when open second modal
export function ConfirmAction({
  confirmAction,
  children,
  message,
}: {
  confirmAction: () => void
  children: React.ReactNode
  message?: string
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {message
              ? message
              : "This action cannot be undone. This will permanently delete your data."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="button-default">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmAction}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
