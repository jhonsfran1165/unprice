import { Button } from "@builderai/ui/button"

import { useMakeReal } from "./useMakeReal"

export function ExportButton() {
  const makeReal = useMakeReal()

  // A tailwind styled button that is pinned to the bottom right of the screen
  return (
    <Button
      onClick={makeReal}
      className="m-2"
      style={{ cursor: "pointer", zIndex: 100000, pointerEvents: "all" }}
    >
      Build with AI
    </Button>
  )
}
