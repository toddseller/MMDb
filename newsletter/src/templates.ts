import type { Holiday } from './choose.ts'
import Christmas from './emails/christmas.tsx'
import Regular from './emails/regular.tsx'

export const REGULAR = [Regular]

export const HOLIDAYS: Holiday<typeof Regular>[] = [
  { from: [12, 1], to: [12, 26], templates: [Christmas] },
]
