export type Belt = 'white' | 'blue' | 'purple' | 'brown' | 'black'
export const BELTS: Belt[] = ['white', 'blue', 'purple', 'brown', 'black']

export type Result = 'win' | 'loss' | 'draw'
export const RESULTS: Result[] = ['win', 'loss', 'draw']

export type Method = 'points' | 'submission' | 'advantages' | 'penalties' | 'referee' | 'dq' | 'walkover'
export const METHODS: Method[] = ['points', 'submission', 'advantages', 'penalties', 'referee', 'dq', 'walkover']
export const METHOD_LABELS: Record<Method, string> = {
  points: 'Points',
  submission: 'Submission',
  advantages: 'Advantages',
  penalties: 'Penalties',
  referee: 'Referee decision',
  dq: 'Disqualification',
  walkover: 'Walkover',
}

export type Place = 1 | 2 | 3

export interface Athlete {
  id: string
  name: string
  belt: Belt
  stripes: number
  weight?: string
}

export interface Championship {
  id: string
  name: string
  date: string
  location?: string
  organization?: string
}

export interface Match {
  id: string
  championshipId: string
  athleteId: string
  opponent: string
  opponentTeam?: string
  round?: string
  result: Result
  method: Method
  submission?: string
  scored: number
  conceded: number
  notes?: string
}

export interface Placement {
  id: string
  championshipId: string
  athleteId: string
  division: string
  place: Place
}

export interface Database {
  athletes: Athlete[]
  championships: Championship[]
  matches: Match[]
  placements: Placement[]
}

export const EMPTY_DB: Database = { athletes: [], championships: [], matches: [], placements: [] }
