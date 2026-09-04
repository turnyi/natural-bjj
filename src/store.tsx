import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { commitDatabase, fetchDatabase, getToken, setToken as persistToken } from './lib/github'
import { EMPTY_DB, type Database } from './types'

interface Store {
  db: Database
  loading: boolean
  error: string | null
  token: string
  setToken: (token: string) => void
  reload: () => Promise<void>
  commit: (mutate: (db: Database) => Database, message: string) => Promise<void>
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database>(EMPTY_DB)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [token, setTokenState] = useState(getToken)

  const reload = useCallback(async () => {
    setLoading(true)
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
  }, [reload])

  const setToken = useCallback((t: string) => {
    persistToken(t)
    setTokenState(t)
  }, [])

  const commit = useCallback(async (mutate: (db: Database) => Database, message: string) => {
    setDb(await commitDatabase(mutate, message))
  }, [])

  const value = useMemo(
    () => ({ db, loading, error, token, setToken, reload, commit }),
    [db, loading, error, token, setToken, reload, commit],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore outside StoreProvider')
  return ctx
}
