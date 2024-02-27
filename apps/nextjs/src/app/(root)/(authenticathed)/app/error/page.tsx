import Link from "next/link"

import { Button } from "@builderai/ui/button"

import { EmptyPlaceholder } from "~/components/empty-placeholder"

export default function NotFound() {
  return (
    <EmptyPlaceholder className="mx-4 my-4">
      <EmptyPlaceholder.Title>404 Not Found</EmptyPlaceholder.Title>
      <EmptyPlaceholder.Description>
        We couldn't find the page that you're looking for!
      </EmptyPlaceholder.Description>
      <div className="flex flex-col items-center justify-center gap-2 md:flex-row">
        <Link href="/">
          <Button variant="secondary" className="w-full items-center gap-2 ">
            Go Back
          </Button>
        </Link>
      </div>
    </EmptyPlaceholder>
  )
}
