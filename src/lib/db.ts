import { createClient } from '@supabase/supabase-js'
import { SUPABASE_KEY, SUPABASE_URL } from '../config'
import type { Athlete, Belt, Championship, Database, Match, Placement } from '../types'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export type Table = 'athletes' | 'championships' | 'matches' | 'placements'
export type Op = 'insert' | 'update' | 'delete'

export interface Session {
  token: string
  athleteId: string | null
  isAdmin: boolean
}

const SESSION_KEY = 'natural-bjj-session'

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export const saveSession = (s: Session | null) =>
  s ? localStorage.setItem(SESSION_KEY, JSON.stringify(s)) : localStorage.removeItem(SESSION_KEY)

const toCamel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
const toSnake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)

const mapKeys = (row: Record<string, unknown>, fn: (k: string) => string) =>
  Object.fromEntries(
    Object.entries(row)
      .filter(([k]) => k !== 'created_at' && k !== 'createdAt')
      .map(([k, v]) => [fn(k), v ?? undefined]),
  )

async function load<T>(table: Table, order: string): Promise<T[]> {
  const { data, error } = await supabase.from(table).select('*').order(order)
  if (error) throw new Error(error.message)
  return (data as Record<string, unknown>[]).map((r) => mapKeys(r, toCamel) as T)
}

export async function fetchDatabase(): Promise<Database> {
  const [athletes, championships, matches, placements] = await Promise.all([
    load<Athlete>('athletes', 'name'),
    load<Championship>('championships', 'date'),
    load<Match>('matches', 'created_at'),
    load<Placement>('placements', 'created_at'),
  ])
  return { athletes, championships, matches, placements }
}

export class SessionExpired extends Error {}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) {
    if (error.message === 'Session expired') throw new SessionExpired('Your session expired. Unlock again.')
    throw new Error(error.message)
  }
  return data as T
}

const toSession = (raw: { token: string; athleteId: string | null; isAdmin: boolean }): Session => ({
  token: raw.token,
  athleteId: raw.athleteId,
  isAdmin: raw.isAdmin,
})

export const login = async (pin: string, athleteId?: string) =>
  toSession(await rpc('login', { pin, p_athlete_id: athleteId ?? null }))

export const register = async (input: { name: string; belt: Belt; stripes: number; weight: string; pin: string }) =>
  toSession(
    await rpc('register', {
      p_name: input.name,
      p_belt: input.belt,
      p_stripes: input.stripes,
      p_weight: input.weight,
      pin: input.pin,
    }),
  )

export const logout = (token: string) => rpc<void>('logout', { token }).catch(() => undefined)

export const whoami = (token: string) => rpc<{ athleteId: string | null; isAdmin: boolean }>('whoami', { token })

export const changePin = (token: string, newPin: string) => rpc<void>('change_pin', { token, new_pin: newPin })

export const setAthletePin = (token: string, athleteId: string, newPin: string) =>
  rpc<void>('set_athlete_pin', { token, p_athlete_id: athleteId, new_pin: newPin })

export const applyChange = (token: string, op: Op, table: Table, row: Record<string, unknown>) =>
  rpc<Record<string, unknown>>('apply_change', { token, op, tbl: table, row_data: mapKeys(row, toSnake) })

export function subscribe(onChange: () => void) {
  const channel = supabase
    .channel('db-changes')
    .on('postgres_changes', { event: '*', schema: 'public' }, onChange)
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}
