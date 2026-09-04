import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  applyChange,
  fetchDatabase,
  loadSession,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  saveSession,
  SessionExpired,
  subscribe,
  whoami,
  type Op,
  type Session,
  type Table,
} from './lib/db'
import { EMPTY_DB, type Belt, type Database } from './types'

export interface Change {
  op: Op
  table: Table
  row: Record<string, unknown>
}

interface Store {
  db: Database
  loading: boolean
  error: string | null
  session: Session | null
  isAdmin: boolean
  canEdit: (athleteId: string) => boolean
  login: (pin: string, athleteId?: string) => Promise<Session>
  register: (input: { name: string; belt: Belt; stripes: number; weight: string; pin: string }) => Promise<Session>
  logout: () => Promise<void>
  reload: () => Promise<void>
  write: (...changes: Change[]) => Promise<void>
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database>(EMPTY_DB)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<Session | null>(loadSession)
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

  const update = useCallback((s: Session | null) => {
    saveSession(s)
    setSession(s)
  }, [])

  useEffect(() => {
    reload()
    const stored = loadSession()
    if (stored) whoami(stored.token).catch((e) => e instanceof SessionExpired && update(null))
    return subscribe(() => {
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(reload, 300)
    })
  }, [reload, update])

  const login = useCallback(
    async (pin: string, athleteId?: string) => {
      const s = await apiLogin(pin, athleteId)
      update(s)
      return s
    },
    [update],
  )

  const register = useCallback(
    async (input: { name: string; belt: Belt; stripes: number; weight: string; pin: string }) => {
      const s = await apiRegister(input)
      update(s)
      await reload()
      return s
    },
    [update, reload],
  )

  const logout = useCallback(async () => {
    if (session) await apiLogout(session.token)
    update(null)
  }, [session, update])

  const write = useCallback(
    async (...changes: Change[]) => {
      if (!session) throw new Error('Unlock first')
      try {
        for (const c of changes) await applyChange(session.token, c.op, c.table, c.row)
      } catch (e) {
        if (e instanceof SessionExpired) update(null)
        throw e
      }
      await reload()
    },
    [session, reload, update],
  )

  const value = useMemo<Store>(
    () => ({
      db,
      loading,
      error,
      session,
      isAdmin: Boolean(session?.isAdmin),
      canEdit: (athleteId: string) => Boolean(session && (session.isAdmin || session.athleteId === athleteId)),
      login,
      register,
      logout,
      reload,
      write,
    }),
    [db, loading, error, session, login, register, logout, reload, write],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore outside StoreProvider')
  return ctx
}
