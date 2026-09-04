import type { Database, Match, Place } from '../types'

export interface Record {
  wins: number
  losses: number
  draws: number
  submissions: number
  submitted: number
  scored: number
  conceded: number
  medals: Record3
}

export type Record3 = { 1: number; 2: number; 3: number }

const emptyMedals = (): Record3 => ({ 1: 0, 2: 0, 3: 0 })

export function summarize(matches: Match[], placements: { place: Place }[]): Record {
  const record: Record = {
    wins: 0,
    losses: 0,
    draws: 0,
    submissions: 0,
    submitted: 0,
    scored: 0,
    conceded: 0,
    medals: emptyMedals(),
  }
  for (const m of matches) {
    if (m.result === 'win') record.wins++
    else if (m.result === 'loss') record.losses++
    else record.draws++
    if (m.method === 'submission') {
      if (m.result === 'win') record.submissions++
      if (m.result === 'loss') record.submitted++
    }
    record.scored += m.scored
    record.conceded += m.conceded
  }
  for (const p of placements) record.medals[p.place]++
  return record
}

export const athleteRecord = (db: Database, athleteId: string) =>
  summarize(
    db.matches.filter((m) => m.athleteId === athleteId),
    db.placements.filter((p) => p.athleteId === athleteId),
  )

export const championshipRecord = (db: Database, championshipId: string) =>
  summarize(
    db.matches.filter((m) => m.championshipId === championshipId),
    db.placements.filter((p) => p.championshipId === championshipId),
  )

export const teamRecord = (db: Database) => summarize(db.matches, db.placements)

export const totalMedals = (r: Record) => r.medals[1] + r.medals[2] + r.medals[3]

export const winRate = (r: Record) => {
  const total = r.wins + r.losses + r.draws
  return total ? Math.round((r.wins / total) * 100) : 0
}

export const byDateDesc = <T extends { date: string }>(a: T, b: T) => b.date.localeCompare(a.date)

export const formatDate = (iso: string) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}
