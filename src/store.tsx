import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { applyChange, fetchDatabase, getPin, setPin as persistPin, subscribe, type Op, type Table } from './lib/db'
import { EMPTY_DB, type Database } from './types'

export interface Change {
  op: Op
  table: Table
  row: Record<string, unknown>
}

interface Store {
  db: Database
  loading: boolean
  error: string | null
  pin: string
  setPin: (pin: string) => void
  reload: () => Promise<void>
  write: (...changes: Change[]) => Promise<void>
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database>(EMPTY_DB)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pin, setPinState] = useState(getPin)
  const timer = useRef<number | undefined>(undefined)

  const reload = useCallback(async () => {
    setError(null)
    try {
      setDb(await fetchDatabase())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
    return subscribe(() => {
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(reload, 300)
    })
  }, [reload])

  const setPin = useCallback((p: string) => {
    persistPin(p)
    setPinState(p)
  }, [])

  const write = useCallback(
    async (...changes: Change[]) => {
      for (const c of changes) await applyChange(c.op, c.table, c.row)
      await reload()
    },
    [reload],
  )

  const value = useMemo(
    () => ({ db, loading, error, pin, setPin, reload, write }),
    [db, loading, error, pin, setPin, reload, write],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore outside StoreProvider')
  return ctx
}
