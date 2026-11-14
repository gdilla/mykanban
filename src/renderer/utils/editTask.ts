import { AppState, Attachment, Task } from '../state/types'

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
  if (!sameItems(draft.tags, opened.tags)) updates.tags = draft.tags.filter(id => existingTagIds.includes(id))
  if (!sameItems(draft.attachments.map(a => a.filename), opened.attachments.map(a => a.filename))) {
    updates.attachments = draft.attachments
  }
  return updates
}

/** Same members, in any order (a tag switched off and on again moves to the end of the list). */
const sameItems = (a: string[], b: string[]) => a.length === b.length && a.every(x => b.includes(x))

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

/**
 * Which attachment files to delete from disk once a deleted task can no longer be restored:
 * its files that no task on the board shows. A duplicate shares its files, and if the task
 * itself is back (Undo, or a reload from disk) that is every one of them. A task deleted
 * since then, which Undo can still bring back, counts as on the board.
 */
export function orphanedFiles(deleted: Task, { tasks, lastDeleted }: Pick<AppState, 'tasks' | 'lastDeleted'>): string[] {
  const live = lastDeleted && lastDeleted.task.id !== deleted.id ? [...tasks, lastDeleted.task] : tasks
  const used = new Set(live.flatMap(t => t.attachments.map(a => a.filename)))
  return deleted.attachments.map(a => a.filename).filter(f => !used.has(f))
}
