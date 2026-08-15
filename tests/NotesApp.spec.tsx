// @vitest-environment jsdom

import { Suspense } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NotesAppBody } from '../src/client/index.js'
import { NotesApp, type NotesAppProps } from '../src/client/NotesApp.js'
import { en } from '../src/client/locales.js'
import { STORAGE_KEY, createLocalStore, type Note, type NoteStore } from '../src/client/notes.js'

function memoryStorage(initial: Record<string, string> = {}): Pick<Storage, 'getItem' | 'setItem'> {
  const data = { ...initial }
  return {
    getItem(key) {
      return Object.hasOwn(data, key) ? data[key]! : null
    },
    setItem(key, value) {
      data[key] = value
    },
  }
}

function seed(notes: readonly Note[]): NoteStore {
  return createLocalStore(memoryStorage({
    [STORAGE_KEY]: JSON.stringify(notes),
  }))
}

function props(
  appPath: string,
  store?: NoteStore,
  renderSlot = vi.fn(() => null),
  navigate = vi.fn(),
  close = vi.fn(),
): NotesAppProps {
  return {
    appId: 'wha1echai.notes',
    appPath,
    search: '',
    hash: '',
    navigate,
    close,
    ...(store === undefined ? {} : { store }),
    renderSlot: renderSlot as unknown as NotesAppProps['renderSlot'],
    t: key => en[key],
  }
}

describe('NotesApp', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('renders an empty list and still exposes the child actions slot', () => {
    const renderSlot = vi.fn(() => <button type="button">Kind action</button>)
    render(<NotesApp {...props('/', createLocalStore(memoryStorage()), renderSlot)} />)

    expect(screen.getByRole('article').getAttribute('data-route')).toBe('/')
    expect(screen.getByText('No notes yet')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Close app' })).toBeNull()
    expect(renderSlot).toHaveBeenCalledWith('wha1echai.notes.actions', { appPath: '/' })
    expect(screen.getByRole('button', { name: 'Kind action' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Extension actions' })).toBeTruthy()
  })

  it('does not render the actions heading when the slot is empty', () => {
    render(<NotesApp {...props('/')} />)
    expect(screen.queryByRole('heading', { name: 'Extension actions' })).toBeNull()
  })

  it('does not render the actions heading when the slot returns an empty host', () => {
    render(<NotesApp {...props('/', createLocalStore(memoryStorage()), vi.fn(() => <div />))} />)
    expect(screen.queryByRole('heading', { name: 'Extension actions' })).toBeNull()
  })

  it('creates a note, addresses it, and ignores blank submits', () => {
    const navigate = vi.fn()
    const store = createLocalStore(memoryStorage())
    render(<NotesApp {...props('/', store, vi.fn(() => null), navigate)} />)

    fireEvent.submit(screen.getByRole('button', { name: 'Save' }).closest('form')!)
    expect(navigate).not.toHaveBeenCalled()

    fireEvent.change(screen.getByPlaceholderText('Write a short note…'), {
      target: { value: '  first whale  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(navigate).toHaveBeenCalledOnce()
    const path = navigate.mock.calls[0]![0] as string
    expect(path).toMatch(/^\/n[0-9a-z]+$/)
    expect(store.load()).toHaveLength(1)
    expect(store.load()[0]!.body).toBe('first whale')
  })

  it('lists notes newest first and opens a detail route', () => {
    const navigate = vi.fn()
    const notes: Note[] = [
      { id: 'n-old', body: 'older\nline', createdAt: 1_000 },
      { id: 'n-new', body: 'newer', createdAt: 2_000 },
    ]
    render(<NotesApp {...props('/', seed(notes), vi.fn(() => null), navigate)} />)

    const rows = screen.getAllByRole('button').filter(button => button.getAttribute('data-app-id'))
    expect(rows.map(row => row.getAttribute('data-app-id'))).toEqual(['n-new', 'n-old'])
    expect(screen.getByText('older')).toBeTruthy()
    fireEvent.click(rows[0]!)
    expect(navigate).toHaveBeenCalledWith('/n-new')
  })

  it('shows a direct-linked note, returns to the list, and does not close the App', () => {
    const navigate = vi.fn()
    const close = vi.fn()
    const note: Note = { id: 'n-1', body: 'keep this', createdAt: Date.UTC(2026, 7, 16) }
    const renderSlot = vi.fn(() => null)
    render(<NotesApp {...props('/n-1', seed([note]), renderSlot, navigate, close)} />)

    expect(screen.getByRole('article').getAttribute('data-route')).toBe('/n-1')
    expect(screen.getByRole('heading', { name: 'keep this' })).toBeTruthy()
    expect(document.querySelector('[data-field="body"]')?.textContent).toContain('keep this')
    expect(document.querySelector('[data-field="created"]')?.textContent).toContain('2026-08-16')
    expect(renderSlot).toHaveBeenCalledWith('wha1echai.notes.actions', { appPath: '/n-1', noteId: 'n-1' })
    fireEvent.click(screen.getByRole('button', { name: 'Back to list' }))
    expect(screen.queryByRole('button', { name: 'Close app' })).toBeNull()
    expect(navigate).toHaveBeenCalledWith('/')
    expect(close).not.toHaveBeenCalled()
  })

  it('deletes a note and leaves the list empty after a remount', () => {
    const navigate = vi.fn()
    const store = seed([{ id: 'n-1', body: 'gone', createdAt: 1 }])
    const view = render(<NotesApp {...props('/n-1', store, vi.fn(() => null), navigate)} />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete note' }))
    expect(navigate).toHaveBeenCalledWith('/')
    expect(store.load()).toEqual([])
    view.unmount()
    render(<NotesApp {...props('/', store)} />)
    expect(screen.getByText('No notes yet')).toBeTruthy()
  })

  it('keeps an unknown note id on the URL as an unavailable state', () => {
    const navigate = vi.fn()
    const close = vi.fn()
    render(<NotesApp {...props('/missing-note', createLocalStore(memoryStorage()), vi.fn(() => null), navigate, close)} />)

    expect(screen.getByRole('article').getAttribute('data-route')).toBe('unavailable')
    expect(screen.getByRole('heading', { name: 'Note unavailable' })).toBeTruthy()
    expect(screen.getByText('/missing-note')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Back to list' }))
    expect(navigate).toHaveBeenCalledWith('/')
    expect(close).not.toHaveBeenCalled()
  })

  it('reloads notes from the default local store after a remount', () => {
    const navigate = vi.fn()
    const first = render(<NotesApp {...props('/', undefined, vi.fn(() => null), navigate)} />)
    fireEvent.change(screen.getByPlaceholderText('Write a short note…'), {
      target: { value: 'survives refresh' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    const path = navigate.mock.calls[0]![0] as string
    first.unmount()

    render(<NotesApp {...props(path)} />)
    expect(screen.getByRole('article').getAttribute('data-route')).toBe(path)
    expect(screen.getByRole('heading', { name: 'survives refresh' })).toBeTruthy()
    expect(document.querySelector('[data-field="body"]')?.textContent).toContain('survives refresh')
  })

  it('lazy-loads the Notes body through the client entry', async () => {
    render(
      <Suspense fallback={<div>loading</div>}>
        <NotesAppBody {...props('/')} />
      </Suspense>,
    )
    await waitFor(() => expect(screen.getByText('No notes yet')).toBeTruthy())
  })
})
