import { Metadata } from "next"

import AuthenticationContainer from "@/components/auth/auth-container"

export const metadata: Metadata = {
  title: "Authentication",
  description: "Authentication forms built using the components.",
}

export default function AuthenticationPage() {
  return <AuthenticationContainer action="login" />
}
