import { createClient } from '@supabase/supabase-js'
import { SUPABASE_KEY, SUPABASE_URL } from '../config'
import type { Athlete, Championship, Database, Match, Placement } from '../types'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export type Table = 'athletes' | 'championships' | 'matches' | 'placements'
export type Op = 'insert' | 'update' | 'delete'

const PIN_KEY = 'natural-bjj-pin'
export const getPin = () => localStorage.getItem(PIN_KEY) ?? ''
export const setPin = (pin: string) => (pin ? localStorage.setItem(PIN_KEY, pin) : localStorage.removeItem(PIN_KEY))

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

export async function applyChange(op: Op, table: Table, row: Record<string, unknown>) {
  const pin = getPin()
  if (!pin) throw new Error('Admin PIN required')
  const { error } = await supabase.rpc('apply_change', {
    pin,
    op,
    tbl: table,
    row_data: mapKeys(row, toSnake),
  })
  if (error) throw new Error(error.message === 'Wrong PIN' ? 'Wrong PIN. Lock admin and enter it again.' : error.message)
}

export async function verifyPin(pin: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('verify_pin', { pin })
  if (error) throw new Error(error.message)
  return Boolean(data)
}

export async function changePin(oldPin: string, newPin: string) {
  const { error } = await supabase.rpc('change_pin', { old_pin: oldPin, new_pin: newPin })
  if (error) throw new Error(error.message)
}

export function subscribe(onChange: () => void) {
  const channel = supabase
    .channel('db-changes')
    .on('postgres_changes', { event: '*', schema: 'public' }, onChange)
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}
