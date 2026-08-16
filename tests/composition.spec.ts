import { afterEach, describe, expect, it, vi } from 'vitest'
import { apply as applyHost } from '../src/index.js'
import { apply as applyInvariant, inject as invariantInject, name as invariantName } from '../src/invariant.js'
import { apply, inject, name, NotesAppBody } from '../src/client/index.js'
import { en, zh } from '../src/client/locales.js'

describe('Notes App composition', () => {
  afterEach(() => vi.restoreAllMocks())

  it('registers metadata, locale, and the lazy App body in one effect', () => {
    const unregisterPage = vi.fn()
    const unregisterLocale = vi.fn()
    const unregisterApp = vi.fn()
    const pageRegister = vi.fn(() => unregisterPage)
    const localeRegister = vi.fn(() => unregisterLocale)
    const slotRegister = vi.fn(() => unregisterApp)
    const slotInject = vi.fn((_name: string, callback: () => (() => void)) => callback())
    const cleanups: Array<() => void> = []
    const effect = vi.fn((execute: () => () => void) => {
      cleanups.push(execute())
    })

    apply({
      pages: { register: pageRegister },
      locale: { register: localeRegister },
      slots: { inject: slotInject, register: slotRegister },
      effect,
    } as never)

    expect(name).toBe('@dshapps/notes-app')
    expect(inject).toEqual(['pages', 'slots', 'locale'])
    expect(effect).toHaveBeenCalledOnce()
    expect(pageRegister).toHaveBeenCalledWith(expect.objectContaining({
      id: 'dshapps.notes',
      label: '鲸鱼笔记',
      surface: 'panel',
    }))
    expect(localeRegister).toHaveBeenCalledWith('notes', { zh, en })
    expect(slotInject).toHaveBeenCalledWith('webpage.app', expect.any(Function))
    expect(slotRegister).toHaveBeenCalledWith({
      name: 'webpage.app',
      key: 'dshapps.notes',
      locale: 'notes',
      children: {
        'dshapps.notes.actions': { kind: 'list', scope: 'root' },
      },
    }, NotesAppBody)

    cleanups[0]!()
    expect(unregisterApp).toHaveBeenCalledOnce()
    expect(unregisterPage).toHaveBeenCalledOnce()
    expect(unregisterLocale).toHaveBeenCalledOnce()
  })

  it('keeps English keys identical to the Chinese source of truth', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort())
  })
})

describe('Notes App host and invariant entries', () => {
  it('contributes no host behavior and reserves package ownership', async () => {
    expect(applyHost).not.toThrow()
    expect(invariantName).toBe('dsh-notes-app-invariant')
    expect(invariantInject).toEqual(['invariants'])
    const register = vi.fn(() => () => {})
    const disposer = await applyInvariant({ invariants: { register } } as never)
    expect(register).toHaveBeenCalledWith('@dshapps/notes-app', expect.any(Function))
    register.mock.calls[0]![1]()
    disposer()
  })
})
