import { describe, expect, it } from 'vitest'
import {
  STORAGE_KEY,
  addNote,
  createLocalStore,
  createNote,
  createNoteId,
  formatCreatedAt,
  noteIdFromPath,
  ordered,
  parseNotes,
  preview,
  removeNote,
} from '../src/client/notes.js'

function memoryStorage(initial: Record<string, string> = {}): Pick<Storage, 'getItem' | 'setItem'> & {
  data: Record<string, string>
} {
  const data = { ...initial }
  return {
    data,
    getItem(key) {
      return Object.hasOwn(data, key) ? data[key]! : null
    },
    setItem(key, value) {
      data[key] = value
    },
  }
}

describe('note path and identity', () => {
  it('reads a note id only from an App-local path with a remainder', () => {
    expect(noteIdFromPath('/')).toBeUndefined()
    expect(noteIdFromPath('')).toBeUndefined()
    expect(noteIdFromPath('n1')).toBeUndefined()
    expect(noteIdFromPath('/n1')).toBe('n1')
    expect(noteIdFromPath('/n1/extra')).toBe('n1/extra')
  })

  it('builds a URL-safe id and treats non-finite entropy as zero', () => {
    expect(createNoteId()).toMatch(/^n[0-9a-z]+$/)
    expect(createNoteId(0, Number.NaN)).toBe('n00000')
    expect(createNoteId(0, Number.POSITIVE_INFINITY)).toBe('n00000')
    expect(createNoteId(36, 0)).toBe('n100000')
    expect(createNoteId(0, 1.25)).toBe(`n0${Math.floor(0.25 * 36 ** 4).toString(36).padStart(4, '0')}`)
    expect(createNoteId(0, -0.5)).toBe(`n0${Math.floor(0.5 * 36 ** 4).toString(36).padStart(4, '0')}`)
  })
})

describe('note presentation', () => {
  it('previews the first line and truncates long copy', () => {
    expect(preview('')).toBe('')
    expect(preview('  hello\nworld  ')).toBe('hello')
    expect(preview('short')).toBe('short')
    expect(preview('abcdefghij', 4)).toBe('abcd…')
  })

  it('formats created time as a UTC calendar day', () => {
    expect(formatCreatedAt(Date.UTC(2026, 7, 16))).toBe('2026-08-16')
  })

  it('orders newest first and breaks ties by id', () => {
    const older = { id: 'b', body: 'older', createdAt: 1 }
    const newer = { id: 'a', body: 'newer', createdAt: 2 }
    const tied = { id: 'c', body: 'tied', createdAt: 2 }
    expect(ordered([older, tied, newer]).map(note => note.id)).toEqual(['a', 'c', 'b'])
  })
})

describe('note mutations', () => {
  it('creates a trimmed note and skips blank input', () => {
    expect(createNote('   ')).toBeUndefined()
    expect(createNote('  hello  ', 10, 0)).toEqual({ id: createNoteId(10, 0), body: 'hello', createdAt: 10 })
  })

  it('prepends and removes notes', () => {
    const first = { id: 'n1', body: 'one', createdAt: 1 }
    const second = { id: 'n2', body: 'two', createdAt: 2 }
    expect(addNote([first], second)).toEqual([second, first])
    expect(removeNote([first, second], 'n1')).toEqual([second])
    expect(removeNote([first], 'missing')).toEqual([first])
  })
})

describe('note persistence', () => {
  it('parses only well-formed notes from a stored payload', () => {
    expect(parseNotes('not-json')).toEqual([])
    expect(parseNotes('{"id":"n1"}')).toEqual([])
    expect(parseNotes(JSON.stringify([
      null,
      1,
      {},
      { id: '', body: 'x', createdAt: 1 },
      { id: 'n1', body: 1, createdAt: 1 },
      { id: 'n2', body: 'ok', createdAt: Number.NaN },
      { id: 'n3', body: 'ok', createdAt: Number.POSITIVE_INFINITY },
      { id: 'n4', body: 'kept', createdAt: 4 },
    ]))).toEqual([{ id: 'n4', body: 'kept', createdAt: 4 }])
  })

  it('loads and saves through local storage, swallowing storage failures', () => {
    const memory = memoryStorage()
    const store = createLocalStore(memory)
    expect(store.load()).toEqual([])
    const note = { id: 'n1', body: 'kept', createdAt: 1 }
    store.save([note])
    expect(memory.data[STORAGE_KEY]).toBe(JSON.stringify([note]))
    expect(createLocalStore(memoryStorage({ [STORAGE_KEY]: '' })).load()).toEqual([])
    expect(createLocalStore(memoryStorage({ [STORAGE_KEY]: JSON.stringify([note]) })).load()).toEqual([note])

    const throwing: Pick<Storage, 'getItem' | 'setItem'> = {
      getItem() {
        throw new Error('blocked')
      },
      setItem() {
        throw new Error('blocked')
      },
    }
    const broken = createLocalStore(throwing)
    expect(broken.load()).toEqual([])
    expect(() => broken.save([note])).not.toThrow()
  })
})
