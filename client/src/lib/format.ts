const DAY = 86_400_000

const dateFmt = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const dateShortFmt = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' })

const timeFmt = new Intl.DateTimeFormat('en-IN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const weekdayFmt = new Intl.DateTimeFormat('en-IN', { weekday: 'long' })

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const inrExact = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const num = new Intl.NumberFormat('en-IN')

export function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return dateFmt.format(d)
}

export function formatDateShort(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return dateShortFmt.format(d)
}

export function formatTime(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return timeFmt.format(d)
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '—'
  return `${formatDate(iso)}, ${formatTime(iso)}`
}

export function formatWeekday(iso: string | null | undefined) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return weekdayFmt.format(d)
}

export function formatRelative(iso: string | null | undefined) {
  if (!iso) return '—'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return '—'
  const diff = Date.now() - then
  const abs = Math.abs(diff)

  if (abs < 60_000) return 'just now'
  if (abs < 3_600_000) {
    const m = Math.round(abs / 60_000)
    return diff > 0 ? `${m} min ago` : `in ${m} min`
  }
  if (abs < DAY) {
    const h = Math.round(abs / 3_600_000)
    return diff > 0 ? `${h} hr ago` : `in ${h} hr`
  }
  const days = Math.round(abs / DAY)
  if (days === 1) return diff > 0 ? 'yesterday' : 'tomorrow'
  if (days < 30) return diff > 0 ? `${days} days ago` : `in ${days} days`
  return formatDate(iso)
}

/** Days a lot has sat since it was created. */
export function ageInDays(iso: string | null | undefined) {
  if (!iso) return 0
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return 0
  return Math.max(0, Math.floor((Date.now() - t) / DAY))
}

export function ageLabel(iso: string | null | undefined) {
  const d = ageInDays(iso)
  if (d === 0) return 'today'
  if (d === 1) return '1 day'
  return `${d} days`
}

export function formatCurrency(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '—'
  return inr.format(value)
}

export function formatCurrencyExact(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '—'
  return inrExact.format(value)
}

export function formatNumber(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '—'
  return num.format(value)
}

export function initials(name: string | null | undefined) {
  if (!name) return '—'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '—'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function isoAt(daysAgo: number, hour = 10, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

export function dateOnly(iso: string | null | undefined) {
  if (!iso) return ''
  return iso.slice(0, 10)
}

export function pluralize(n: number, one: string, many = `${one}s`) {
  return n === 1 ? one : many
}

export function titleCase(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
