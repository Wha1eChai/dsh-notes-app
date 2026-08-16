/** localStorage key for the Notes App. The platform owns no store. */
export const STORAGE_KEY = 'dshapps.notes:v1'

/** One addressable short text note. */
export interface Note {
  readonly id: string
  readonly body: string
  readonly createdAt: number
}

/** Persistence face used by the App body. */
export interface NoteStore {
  load(): readonly Note[]
  save(notes: readonly Note[]): void
}

/** App-local path `/` has no note id; every other `/<id>` keeps the remainder. */
export function noteIdFromPath(appPath: string): string | undefined {
  if (!appPath.startsWith('/') || appPath === '/') return undefined
  return appPath.slice(1)
}

/** Stable URL-safe id from a clock and a unit interval. */
export function createNoteId(now = Date.now(), entropy = Math.random()): string {
  const unit = Number.isFinite(entropy) ? Math.abs(entropy) % 1 : 0
  const suffix = Math.floor(unit * 36 ** 4).toString(36).padStart(4, '0')
  return `n${now.toString(36)}${suffix}`
}

/** First line of a note, truncated for list rows. */
export function preview(body: string, max = 48): string {
  const first = body.trim().split(/\r?\n/, 1)[0]!
  if (first.length <= max) return first
  return `${first.slice(0, max)}…`
}

/** Calendar day of a note, language-neutral. */
export function formatCreatedAt(createdAt: number): string {
  return new Date(createdAt).toISOString().slice(0, 10)
}

/** Newest notes first; equal clocks fall back to id order. */
export function ordered(notes: readonly Note[]): Note[] {
  return [...notes].sort((left, right) => {
    const byTime = right.createdAt - left.createdAt
    return byTime !== 0 ? byTime : left.id.localeCompare(right.id)
  })
}

/** Build a note from trimmed body, or skip blank input. */
export function createNote(body: string, now = Date.now(), entropy = Math.random()): Note | undefined {
  const trimmed = body.trim()
  if (trimmed.length === 0) return undefined
  return { id: createNoteId(now, entropy), body: trimmed, createdAt: now }
}

/** Prepend a created note. */
export function addNote(notes: readonly Note[], note: Note): Note[] {
  return [note, ...notes]
}

/** Drop the note with this id, if present. */
export function removeNote(notes: readonly Note[], id: string): Note[] {
  return notes.filter(note => note.id !== id)
}

/** Parse a stored payload, dropping anything that is not a note. */
export function parseNotes(raw: string): Note[] {
  try {
    const value: unknown = JSON.parse(raw)
    if (!Array.isArray(value)) return []
    const notes: Note[] = []
    for (const entry of value) {
      if (isNote(entry)) notes.push(entry)
    }
    return notes
  } catch {
    return []
  }
}

/** Browser-local store. Failures read as empty and writes are ignored. */
export function createLocalStore(storage: Pick<Storage, 'getItem' | 'setItem'>): NoteStore {
  return {
    load() {
      try {
        const raw = storage.getItem(STORAGE_KEY)
        if (raw == null || raw === '') return []
        return parseNotes(raw)
      } catch {
        return []
      }
    },
    save(notes) {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(notes))
      } catch {
        return
      }
    },
  }
}

function isNote(value: unknown): value is Note {
  if (value === null || typeof value !== 'object') return false
  const note = value as Record<string, unknown>
  return typeof note.id === 'string'
    && note.id.length > 0
    && typeof note.body === 'string'
    && typeof note.createdAt === 'number'
    && Number.isFinite(note.createdAt)
}
