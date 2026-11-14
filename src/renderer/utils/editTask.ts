import { Attachment, Task } from '../state/types'

/** The fields the edit window lets you change (status is moved separately, with MOVE_TASK). */
export type TaskDraft = Pick<Task, 'title' | 'description' | 'dueDate' | 'tags' | 'attachments'>

/**
 * What saving the edit window should write: only the fields that differ from the
 * task as it was when the window opened, so closing an untouched window writes nothing.
 * An emptied title keeps the old one. Edited tags are limited to tags that still
 * exist (a tag can be deleted by an agent while the window is open).
 */
export function editedFields(opened: Task, draft: TaskDraft, existingTagIds: string[]): Partial<Task> {
  const updates: Partial<Task> = {}
  const title = draft.title.trim()
  if (title && title !== opened.title) updates.title = title
  if (draft.description !== (opened.description || '')) updates.description = draft.description
  if (draft.dueDate !== (opened.dueDate || '')) updates.dueDate = draft.dueDate
  if (draft.tags !== opened.tags) updates.tags = draft.tags.filter(id => existingTagIds.includes(id))
  if (draft.attachments !== opened.attachments) updates.attachments = draft.attachments
  return updates
}

/**
 * Which attachment files to delete from disk when the edit window closes.
 * Cancel: the files added in this session (nothing references them).
 * Save: the files that were on the task at open and have been removed.
 */
export function filesToDelete(atOpen: Attachment[], now: Attachment[], outcome: 'save' | 'cancel'): string[] {
  const [from, kept] = outcome === 'save' ? [atOpen, now] : [now, atOpen]
  const keep = new Set(kept.map(a => a.filename))
  return from.map(a => a.filename).filter(f => !keep.has(f))
}
