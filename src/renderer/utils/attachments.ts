import { Attachment } from '../state/types'

/**
 * Which attachment files to delete from disk when the edit window closes.
 * Cancel: the files added in this session (nothing references them).
 * Save: the files that were on the task at open and have been removed —
 * except any that another task still references (duplicated tasks share files).
 */
export function filesToDelete(
  atOpen: Attachment[],
  now: Attachment[],
  outcome: 'save' | 'cancel',
  usedElsewhere: string[] = [],
): string[] {
  const [from, kept] = outcome === 'save' ? [atOpen, now] : [now, atOpen]
  const keep = new Set([...kept.map(a => a.filename), ...usedElsewhere])
  return from.map(a => a.filename).filter(f => !keep.has(f))
}
