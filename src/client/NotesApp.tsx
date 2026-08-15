import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import type { PropsLocale, PropsRenderSlots } from '@deepseek-ai/dsh-client-ui-slots'
import type { WebpageAppSlotProps } from '@wha1echai/dsh-webpage/client'
import { AppEmpty, AppField, AppFields, AppList, AppPage, AppRow } from '@wha1echai/dsh-webpage/ui'
import type { NotesAppOwner } from '../index.js'
import {
  addNote,
  createLocalStore,
  createNote,
  formatCreatedAt,
  noteIdFromPath,
  ordered,
  preview,
  removeNote,
  type Note,
  type NoteStore,
} from './notes.js'
import styles from './NotesApp.module.css'

export type NotesAppProps =
  WebpageAppSlotProps
  & PropsRenderSlots<'wha1echai.notes.actions'>
  & PropsLocale<'notes'>
  & {
    store?: NoteStore
  }

type Translate = NotesAppProps['t']

interface PageProps {
  actions: ReactNode
  navigate: NotesAppProps['navigate']
  t: Translate
}

function ListPage({
  actions,
  draft,
  navigate,
  notes,
  onDraft,
  onCreate,
  t,
}: PageProps & {
  draft: string
  notes: readonly Note[]
  onDraft: (value: string) => void
  onCreate: (event: FormEvent<HTMLFormElement>) => void
}): ReactNode {
  const rows = useMemo(() => ordered(notes), [notes])
  return (
    <article data-route="/">
      <AppPage title={t('listTitle')} description={t('description')} actions={actions} actionsLabel={t('actions')}>
        <form className={styles.composer} onSubmit={onCreate}>
          <label>
            {t('composerLabel')}
            <textarea
              className={styles.bodyInput}
              value={draft}
              placeholder={t('bodyPlaceholder')}
              onChange={event => onDraft(event.target.value)}
            />
          </label>
          <div className={styles.controls}>
            <button type="submit" className={styles.primaryButton} disabled={draft.trim().length === 0}>
              {t('create')}
            </button>
          </div>
        </form>
        {rows.length === 0
          ? <AppEmpty>{t('listEmpty')}</AppEmpty>
          : (
            <AppList dense label={t('listTitle')}>
              {rows.map(note => (
                <AppRow
                  key={note.id}
                  dense
                  data-app-id={note.id}
                  title={preview(note.body)}
                  description={formatCreatedAt(note.createdAt)}
                  onClick={() => navigate(`/${note.id}`)}
                />
              ))}
            </AppList>
          )}
      </AppPage>
    </article>
  )
}

function DetailPage({
  actions,
  navigate,
  note,
  onDelete,
  t,
}: PageProps & { note: Note; onDelete: () => void }): ReactNode {
  return (
    <article data-route={`/${note.id}`}>
      <AppPage title={preview(note.body)} actions={actions} actionsLabel={t('actions')}>
        <AppFields>
          <AppField field="body" label={t('body')} value={<pre className={styles.noteBody}>{note.body}</pre>} />
          <AppField field="created" label={t('created')} value={formatCreatedAt(note.createdAt)} />
        </AppFields>
        <div className={styles.controls}>
          <button type="button" className={styles.secondaryButton} onClick={() => navigate('/')}>{t('backToList')}</button>
          <button type="button" className={styles.primaryButton} onClick={onDelete}>{t('delete')}</button>
        </div>
      </AppPage>
    </article>
  )
}

function UnavailablePage({
  actions,
  appPath,
  navigate,
  t,
}: PageProps & { appPath: string }): ReactNode {
  return (
    <article data-route="unavailable">
      <AppPage title={t('unavailableTitle')} description={t('unavailableDescription')} actions={actions} actionsLabel={t('actions')}>
        <code className={styles.path}>{appPath}</code>
        <div className={styles.controls}>
          <button type="button" className={styles.primaryButton} onClick={() => navigate('/')}>{t('backToList')}</button>
        </div>
      </AppPage>
    </article>
  )
}

/** Render the note list, a direct-linked note, or an unavailable address. */
export function NotesApp({ appPath, navigate, renderSlot, t, store }: NotesAppProps): ReactNode {
  const resolvedStore = useMemo(() => store ?? createLocalStore(globalThis.localStorage), [store])
  const [notes, setNotes] = useState(() => resolvedStore.load())
  const [draft, setDraft] = useState('')
  const noteId = noteIdFromPath(appPath)
  const note = noteId === undefined ? undefined : notes.find(entry => entry.id === noteId)
  const owner: NotesAppOwner = Object.freeze(noteId === undefined ? { appPath } : { appPath, noteId })
  const actions = renderSlot('wha1echai.notes.actions', owner)

  const persist = (next: readonly Note[]): void => {
    resolvedStore.save(next)
    setNotes(next)
  }

  const onCreate = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const created = createNote(draft)
    if (created === undefined) return
    persist(addNote(notes, created))
    setDraft('')
    navigate(`/${created.id}`)
  }

  const pageProps = { actions, navigate, t }

  if (noteId !== undefined) {
    if (note === undefined) return <UnavailablePage {...pageProps} appPath={appPath} />
    return (
      <DetailPage
        {...pageProps}
        note={note}
        onDelete={() => {
          persist(removeNote(notes, note.id))
          navigate('/')
        }}
      />
    )
  }

  return (
    <ListPage
      {...pageProps}
      draft={draft}
      notes={notes}
      onDraft={setDraft}
      onCreate={onCreate}
    />
  )
}
