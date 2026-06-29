import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { env } from '../config/env.js'

let transporter: Transporter | null = null

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: env.smtp.user
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
  if (!env.smtp.host) {
    console.warn('[mail] SMTP_HOST not configured — outbound mail disabled')
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
  if (!env.smtp.host) {
    throw new Error('SMTP is not configured')
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
    configured: Boolean(env.smtp.host),
  }
}

function redactSecret(value: string): string {
  if (value.length <= 2) return '**'
  return `${value.slice(0, 2)}${'*'.repeat(Math.min(value.length - 2, 8))}`
}
