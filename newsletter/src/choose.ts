export type Holiday<T> = { from: [month: number, day: number], to: [month: number, day: number], templates: T[] }

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const FIRST_SUNDAY = Date.UTC(1970, 0, 4)

// Counted from a fixed Sunday rather than by calendar week, which restarts at New Year and could repeat a template.
const weekIndex = (date: Date) => Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - FIRST_SUNDAY) / WEEK_MS)

const monthDay = (month: number, day: number) => month * 100 + day

export const choose = <T>(date: Date, regular: T[], holidays: Holiday<T>[]) => {
  const today = monthDay(date.getMonth() + 1, date.getDate())
  const holiday = holidays.find(({ from, to }) => monthDay(...from) <= today && today <= monthDay(...to))
  const set = holiday?.templates ?? regular
  return set[weekIndex(date) % set.length]
}
