import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { env } from '../config/env.js'

let transporter: Transporter | null = null

/** True when host is set and auth (if any) is complete. */
export function isSmtpConfigured(): boolean {
  if (!env.smtp.host.trim()) return false
  if (env.smtp.user.trim() && !env.smtp.password) return false
  return true
}

function smtpConfigIssue(): string | null {
  if (!env.smtp.host.trim()) {
    return 'SMTP_HOST not configured — outbound mail disabled'
  }
  if (env.smtp.user.trim() && !env.smtp.password) {
    return 'SMTP_USER is set but SMTP_PASSWORD is missing — outbound mail disabled'
  }
  return null
}

function getTransporter(): Transporter {
  if (!transporter) {
    const hasAuth = Boolean(env.smtp.user.trim())
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: hasAuth
        ? {
            user: env.smtp.user,
            pass: env.smtp.password,
          }
        : undefined,
      tls: {
        rejectUnauthorized: env.smtp.tlsRejectUnauthorized,
      },
    })
  }
  return transporter
}

export async function verifySmtpConnection(): Promise<boolean> {
  const issue = smtpConfigIssue()
  if (issue) {
    console.warn(`[mail] ${issue}`)
    return false
  }
  try {
    await getTransporter().verify()
    console.log('[mail] SMTP connection verified')
    return true
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown SMTP error'
    console.warn(`[mail] SMTP connection failed: ${message}`)
    return false
  }
}

export interface SendMailInput {
  to: string
  subject: string
  html: string
  text: string
}

export async function sendMail(input: SendMailInput): Promise<{ messageId: string }> {
  const issue = smtpConfigIssue()
  if (issue) {
    throw new Error(issue)
  }

  const info = await getTransporter().sendMail({
    from: `"${env.smtp.fromName}" <${env.smtp.fromAddress}>`,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  })

  return { messageId: info.messageId ?? '' }
}

export function getSmtpPublicConfig() {
  return {
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    fromAddress: env.smtp.fromAddress,
    fromName: env.smtp.fromName,
    user: env.smtp.user ? redactSecret(env.smtp.user) : null,
    configured: isSmtpConfigured(),
  }
}

function redactSecret(value: string): string {
  if (value.length <= 2) return '**'
  return `${value.slice(0, 2)}${'*'.repeat(Math.min(value.length - 2, 8))}`
}
