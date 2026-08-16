import { lazy } from 'react'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { AppDescriptor } from '@dshapps/webpage/client'

import { en, zh } from './locales.js'

/** App body is a lazy module so a throw or suspend stays inside Webpage's AppBoundary. */
export const NotesAppBody = lazy(async () => {
  const module = await import('./NotesApp.js')
  return { default: module.NotesApp }
})

const descriptor = Object.freeze({
  id: 'dshapps.notes',
  label: '鲸鱼笔记',
  description: '创建、查看和删除短文本笔记。',
  order: 40,
  categories: ['notes'],
  surface: 'panel',
}) satisfies AppDescriptor

const LOCALE_NAMESPACE = 'notes'
const APP_ID = 'dshapps.notes'

/** Stable Loader identity used for Cordis fiber provenance. */
export const name = '@dshapps/notes-app'

/** Client services required by the Notes App. */
export const inject = ['pages', 'slots', 'locale']

/** Register App metadata and the keyed Webpage body in one Cordis effect. */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => {
    const unregisterLocale = ctx.locale.register(LOCALE_NAMESPACE, { zh, en })
    const unregisterPage = ctx.pages.register(descriptor)
    const unregisterApp = ctx.slots.inject('webpage.app', () => ctx.slots.register({
      name: 'webpage.app',
      key: APP_ID,
      locale: LOCALE_NAMESPACE,
      children: {
        'dshapps.notes.actions': { kind: 'list', scope: 'root' },
      },
    }, NotesAppBody))

    return () => {
      unregisterApp()
      unregisterPage()
      unregisterLocale()
    }
  }, 'dsh-notes-app: composition')
}

export type { NotesAppProps } from './NotesApp.js'
