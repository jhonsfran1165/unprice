import { Typography } from "@unprice/ui/typography"
import Image from "next/image"

export default function NotFound() {
  return (
    <div className="mt-20 flex flex-col items-center space-x-4">
      <Typography variant="h1">404</Typography>
      <Image
        alt="missing site"
        src="https://illustrations.popsy.co/gray/falling.svg"
        width={400}
        height={400}
      />
      <p className="text-lg text-stone-500">TODO: create this page</p>
    </div>
  )
}
