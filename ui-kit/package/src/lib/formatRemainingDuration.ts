const MS_PER_MINUTE = 60_000
const MS_PER_HOUR = 60 * MS_PER_MINUTE
const MS_PER_DAY = 24 * MS_PER_HOUR

/** Compact remaining duration: `12min`, `3hrs 15 min`, `2days 5hrs`, `5days`. */
export function formatRemainingDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return ''

  if (ms < MS_PER_HOUR) {
    const minutes = Math.max(1, Math.ceil(ms / MS_PER_MINUTE))
    return `${minutes}min`
  }

  if (ms < MS_PER_DAY) {
    let hours = Math.floor(ms / MS_PER_HOUR)
    let minutes = Math.ceil((ms % MS_PER_HOUR) / MS_PER_MINUTE)
    if (minutes === 60) {
      hours += 1
      minutes = 0
    }
    if (hours >= 24) {
      return formatRemainingDuration(hours * MS_PER_HOUR)
    }
    if (minutes === 0) return `${hours}hrs`
    return `${hours}hrs ${minutes} min`
  }

  let days = Math.floor(ms / MS_PER_DAY)
  let hours = Math.ceil((ms % MS_PER_DAY) / MS_PER_HOUR)
  if (hours === 24) {
    days += 1
    hours = 0
  }
  if (hours === 0) return `${days}days`
  return `${days}days ${hours}hrs`
}
