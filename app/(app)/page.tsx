import { notFound } from "next/navigation"

// Testing functionality error and notfound
export default function Index() {
  // notFound()
  throw new Error("Oh no! Something went wrong.")
}
