export function toYmd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseYmd(ymd: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim())
  if (!match) return undefined
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return undefined
  }
  return date
}

export function addDaysYmd(ymd: string, days: number): string {
  const date = parseYmd(ymd)
  if (!date) return ymd
  date.setDate(date.getDate() + days)
  return toYmd(date)
}

export function weekdayOfYmd(ymd: string): number {
  return parseYmd(ymd)?.getDay() ?? 0
}

export function dayOfMonthOfYmd(ymd: string): number {
  return parseYmd(ymd)?.getDate() ?? 1
}

export function todayYmd(): string {
  return toYmd(new Date())
}
