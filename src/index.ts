/** Owner data passed to Notes App action contributions. */
export interface NotesAppOwner {
  readonly appPath: string
  readonly noteId?: string
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    /** Kind-specific actions contributed under the Notes App. */
    'wha1echai.notes.actions': {
      kind: 'list'
      scope: 'root'
      owner: NotesAppOwner
    }
  }
}

/** Host-side lifecycle entry; the App is a client composition contribution. */
export function apply(): void {}
