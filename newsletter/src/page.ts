import { randomBytes } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

// The local (Pacific) calendar date, which toISOString's UTC date would not give.
export const isoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

// The random part keeps issue addresses from being guessed from the date alone.
export const writePage = async (dir: string, date: Date, html: string) => {
  const name = `${isoDate(date)}-${randomBytes(6).toString('base64url')}.html`
  await writeFile(join(dir, name), html, { flag: 'wx' })
  return name
}
