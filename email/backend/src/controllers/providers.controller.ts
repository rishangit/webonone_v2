import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { ProviderTestBody } from '../schemas/providers.schema.js'
import { getSmtpPublicConfig, sendMail, verifySmtpConnection } from '../services/mail.service.js'

export async function getProviders(_req: AuthenticatedRequest, res: Response) {
  const connected = await verifySmtpConnection()
  res.json({
    ...getSmtpPublicConfig(),
    connectionStatus: connected ? 'connected' : 'disconnected',
  })
}

export async function testProvider(req: AuthenticatedRequest, res: Response) {
  const body = req.body as ProviderTestBody
  const to = body.toEmail ?? req.user?.email
  if (!to) {
    res.status(400).json({ message: 'Recipient email required', code: 'BAD_REQUEST' })
    return
  }

  try {
    const result = await sendMail({
      to,
      subject: 'WebOnOne Email — SMTP test',
      html: '<p>This is a test message from the Email service SMTP configuration.</p>',
      text: 'This is a test message from the Email service SMTP configuration.',
    })
    res.json({ ok: true, messageId: result.messageId })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'SMTP test failed'
    res.status(502).json({ message, code: 'SMTP_ERROR' })
  }
}
