import { REPO } from '../config'
import type { Database } from '../types'

const API = `https://api.github.com/repos/${REPO.owner}/${REPO.name}/contents/${REPO.path}`
const RAW = `https://raw.githubusercontent.com/${REPO.owner}/${REPO.name}/${REPO.branch}/${REPO.path}`
const TOKEN_KEY = 'natural-bjj-token'

export const getToken = () => localStorage.getItem(TOKEN_KEY) ?? ''
export const setToken = (token: string) =>
  token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY)

const headers = (token: string, accept = 'application/vnd.github+json') => {
  const h: Record<string, string> = { Accept: accept }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

const encode = (text: string) => {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary)
}

const decode = (b64: string) =>
  new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, '')), (c) => c.charCodeAt(0)))

export async function fetchDatabase(): Promise<Database> {
  const res = await fetch(`${API}?ref=${REPO.branch}`, {
    headers: headers(getToken(), 'application/vnd.github.raw+json'),
    cache: 'no-store',
  })
  if (res.ok) return res.json()
  const raw = await fetch(`${RAW}?t=${Date.now()}`, { cache: 'no-store' })
  if (!raw.ok) throw new Error('Could not load team data')
  return raw.json()
}

async function fetchWithSha(token: string): Promise<{ db: Database; sha: string }> {
  const res = await fetch(`${API}?ref=${REPO.branch}`, { headers: headers(token), cache: 'no-store' })
  if (res.status === 401) throw new Error('Token rejected by GitHub')
  if (!res.ok) throw new Error(`Could not load data (${res.status})`)
  const json = await res.json()
  return { db: JSON.parse(decode(json.content)), sha: json.sha }
}

export async function commitDatabase(mutate: (db: Database) => Database, message: string): Promise<Database> {
  const token = getToken()
  if (!token) throw new Error('Admin token required')
  const { db, sha } = await fetchWithSha(token)
  const next = mutate(db)
  const res = await fetch(API, {
    method: 'PUT',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: encode(JSON.stringify(next, null, 2) + '\n'),
      sha,
      branch: REPO.branch,
    }),
  })
  if (res.status === 401 || res.status === 403) throw new Error('Token lacks write access to the repo')
  if (res.status === 409) throw new Error('Someone else saved at the same time. Try again.')
  if (!res.ok) throw new Error(`Save failed (${res.status})`)
  return next
}

export async function verifyToken(token: string): Promise<boolean> {
  const res = await fetch(`https://api.github.com/repos/${REPO.owner}/${REPO.name}`, { headers: headers(token) })
  if (!res.ok) return false
  const json = await res.json()
  return Boolean(json.permissions?.push)
}
