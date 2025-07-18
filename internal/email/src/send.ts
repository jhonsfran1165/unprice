// src/utils/emails.ts or lib/emails.ts (adjust path as needed)

import { render } from "@react-email/render" // Import the render function
import nodemailer from "nodemailer" // Import nodemailer
import { Resend } from "resend"
import { env } from "./env" // Assuming this handles your environment variables

// --- Resend/Production Setup ---
// Initialize Resend once for production use
export const resend = new Resend(env.RESEND_API_KEY)

// IMPORTANT: This should be a verified domain/email with Resend for production
// For Mailpit testing, this value is not strictly used by Mailpit itself.
const RESEND_DEFAULT_FROM_EMAIL = "Seb from Unprice <seb@unprice.dev>"

// --- Mailpit/Development Setup ---
let mailpitTransporter: nodemailer.Transporter | null = null

const getMailpitTransporter = () => {
  if (!mailpitTransporter) {
    mailpitTransporter = nodemailer.createTransport({
      host: "localhost",
      port: 1025,
      secure: false, // Mailpit runs without TLS by default on 1025
      ignoreTLS: true, // Don't require TLS for local testing
    })
  }
  return mailpitTransporter
}

// --- Common Interfaces ---
export interface Emails {
  react: JSX.Element // Your React Email component
  subject: string
  to: string[]
  from?: string // Make from optional, will default to RESEND_DEFAULT_FROM_EMAIL
}

// Keep EmailHtml if you still have a separate use case for pre-rendered HTML
export interface EmailHtml {
  html: string
  subject: string
  to: string[]
  from?: string // Make from optional
}

// --- Unified Email Sending Function ---
export const sendEmail = async (emailOptions: Emails) => {
  const { react, subject, to, from = RESEND_DEFAULT_FROM_EMAIL } = emailOptions

  // Render the React Email component to HTML and plain text
  const htmlContent = await render(react)
  const textContent = await render(react, { plainText: true })

  const emailPayload = {
    to,
    from,
    subject,
    html: htmlContent,
    text: textContent, // Include plain text for better email client compatibility
    react,
  }

  if (env.NODE_ENV === "development") {
    try {
      const transporter = getMailpitTransporter()
      const info = await transporter.sendMail(emailPayload)
      return { data: info, error: null } // Mimic Resend's return structure
    } catch (error) {
      console.error("Error sending email to Mailpit:", error)
      return { data: null, error: error }
    }
  } else {
    // Production environment: Use Resend
    try {
      const { data, error } = await resend.emails.send({ react, subject, to, from })
      return { data, error }
    } catch (error) {
      return { data: null, error: error }
    }
  }
}

// Keep sendEmailHtml if you still need it for specific cases,
// but it won't benefit from React Email rendering directly.
// You'd need to manually render the HTML before calling this.
export const sendEmailHtml = async (email: EmailHtml) => {
  const { html, subject, to, from = RESEND_DEFAULT_FROM_EMAIL } = email

  if (env.NODE_ENV === "development") {
    console.info("Sending pre-rendered HTML email to Mailpit (development mode)...")
    try {
      const transporter = getMailpitTransporter()
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        html,
      })
      console.info("Pre-rendered HTML email sent to Mailpit:", info.messageId)
    } catch (error) {
      console.error("Error sending pre-rendered HTML email to Mailpit:", error)
    }
  } else {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        to: email.to,
        from: email.from,
        subject: email.subject,
        html: email.html,
      }),
    })
  }
}
