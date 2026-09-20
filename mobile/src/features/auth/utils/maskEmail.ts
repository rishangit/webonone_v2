export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  const visible = local.length <= 2 ? (local[0] ?? '*') : `${local.slice(0, 2)}***`
  return `${visible}@${domain}`
}
