import { render } from "@react-email/render"
import { Resend } from "resend"
import { env } from "./env"

export const resend = new Resend(env.RESEND_API_KEY)

const RESEND_DEFAULT_FROM_EMAIL = "Seb from Unprice <seb@unprice.dev>"

// Lazy load nodemailer only when needed (development + server)
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
let mailpitTransporter: any = null

async function getMailpitTransporter() {
  if (!mailpitTransporter) {
    const nodemailer = await import("nodemailer") // Dynamic import
    mailpitTransporter = nodemailer.createTransport({
      host: "localhost",
      port: 1025,
      secure: false,
      ignoreTLS: true,
    })
  }
  return mailpitTransporter
}

export interface Emails {
  react: JSX.Element
  subject: string
  to: string[]
  from?: string
}

export interface EmailHtml {
  html: string
  subject: string
  to: string[]
  from?: string
}

// --- Main React Email Sender ---
export const sendEmail = async ({
  react,
  subject,
  to,
  from = RESEND_DEFAULT_FROM_EMAIL,
}: Emails) => {
  const html = await render(react)
  const text = await render(react, { plainText: true })

  if (env.NODE_ENV === "development") {
    try {
      const transporter = await getMailpitTransporter()
      const info = await transporter.sendMail({ from, to, subject, html, text })
      return { data: info, error: null }
    } catch (error) {
      console.error("Error sending email to Mailpit:", error)
      return { data: null, error }
    }
  }

  try {
    return await resend.emails.send({ react, subject, to, from })
  } catch (error) {
    return { data: null, error }
  }
}

// --- Pre-rendered HTML Email Sender ---
export const sendEmailHtml = async ({
  html,
  subject,
  to,
  from = RESEND_DEFAULT_FROM_EMAIL,
}: EmailHtml) => {
  if (env.NODE_ENV === "development") {
    try {
      const transporter = await getMailpitTransporter()
      const info = await transporter.sendMail({ from, to, subject, html })
      console.info("Pre-rendered HTML email sent to Mailpit:", info.messageId)
      return { data: info, error: null }
    } catch (error) {
      console.error("Error sending pre-rendered HTML email to Mailpit:", error)
      return { data: null, error }
    }
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({ to, from, subject, html }),
    })

    if (!res.ok) {
      throw new Error(`Failed to send email via Resend: ${res.statusText}`)
    }

    const data = await res.json()
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}
