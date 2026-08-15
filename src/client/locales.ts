/** Notes App product copy: Chinese is the default and English is complete. */
export const zh = Object.freeze({
  title: '鲸鱼笔记',
  description: '创建、查看和删除短文本笔记。',
  listTitle: '全部笔记',
  listEmpty: '还没有笔记',
  composerLabel: '新笔记',
  bodyPlaceholder: '写下一句短笔记…',
  create: '记下',
  openNote: '打开笔记',
  backToList: '返回列表',
  delete: '删除笔记',
  noteTitle: '笔记',
  body: '正文',
  created: '创建时间',
  unavailableTitle: '笔记不可用',
  unavailableDescription: '没有这条笔记，地址保持不变。',
  actions: '扩展操作',
})

export const en = Object.freeze({
  title: 'Whale Notes',
  description: 'Create, list, and delete short text notes.',
  listTitle: 'All notes',
  listEmpty: 'No notes yet',
  composerLabel: 'New note',
  bodyPlaceholder: 'Write a short note…',
  create: 'Save',
  openNote: 'Open note',
  backToList: 'Back to list',
  delete: 'Delete note',
  noteTitle: 'Note',
  body: 'Body',
  created: 'Created',
  unavailableTitle: 'Note unavailable',
  unavailableDescription: 'There is no note at this address. The URL is unchanged.',
  actions: 'Extension actions',
})

export type NotesLocaleKey = keyof typeof zh

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    notes: NotesLocaleKey
  }
}
