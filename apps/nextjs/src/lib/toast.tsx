import type { ExternalToast } from "@unprice/ui/sonner"
import { toast } from "@unprice/ui/sonner"

type ToastType = "default" | "description" | "success" | "warning" | "info" | "error" | "promise"

const config = {
  error: {
    type: "error",
    title: "Something went wrong",
  },
  "error-contact": {
    type: "error",
    title: "Something went wrong",
    description: "Please try again",
    action: {
      label: "Discord",
      onClick: () => window.open("/discord", "_blank")?.location,
    },
  },
  "unique-slug": {
    type: "warning",
    title: "Slug is already taken",
    description: "Please select another slug. Every slug is unique.",
  },
  success: { type: "success", title: "Success" },
  deleted: { type: "success", title: "Deleted successfully" },
  removed: { type: "success", title: "Removed successfully" },
  saved: { type: "success", title: "Saved successfully" },
  updated: { type: "success", title: "Updated successfully" },
  "test-error": {
    type: "error",
    title: "Connection Failed",
    description: "Please enter a correct URL",
  },
  "test-warning-empty-url": {
    type: "warning",
    title: "URL is Empty",
    description: "Please enter a valid, non-empty URL",
  },
  "test-success": {
    type: "success",
    title: "Connection Established",
  },
} as const

type ToastConfig = Pick<ExternalToast, "action" | "description"> & {
  type: ToastType
  title: string
}

const _config: Record<string, ToastConfig> = config

type ToastAction = keyof typeof config

export function toastAction(action: ToastAction, message?: string) {
  const { title, type, ...rest } = _config[action]!
  const props = { ...rest, description: message }

  if (type === "default") return toast(title, props)
  if (type === "success") return toast.success(title, props)
  if (type === "error") return toast.error(title, props)
  if (type === "warning") return toast.warning(title, props)
  if (type === "description") return toast.message(title, props)
  if (type === "info") return toast.info(title, props)
}

export { toast }
