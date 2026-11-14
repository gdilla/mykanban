import { Tag, Task } from '../../state/types'

// What the command palette lists for a query. Pure, so it can be tested without a DOM;
// CommandPalette.tsx draws the sections and runs the chosen item.

export type ActionId = 'new-task' | 'switch-view' | 'manage-tags' | 'summaries' | 'toggle-filters'

export type PaletteItem = { key: string; label: string } & (
  | { kind: 'task'; task: Task }
  | { kind: 'action'; action: ActionId; hint?: string }
  | { kind: 'filter'; tag: Tag; active: boolean }
  | { kind: 'palette'; paletteId: string | null; preview?: string; active: boolean } // null = match system
)

export interface PaletteSection {
  heading: string
  items: PaletteItem[]
}

export interface PaletteContext {
  tasks: Task[]
  tags: Tag[]
  activeTagIds: string[]
  currentView: 'status' | 'tags'
  palettes: { id: string; name: string; preview: string }[]
  paletteId: string | null // the user's pick; null while following the system appearance
}

const CAP = 8
const RECENT = 5

// ponytail: every word of the query must appear somewhere in the text (case-insensitive substring),
// no typo tolerance or scoring. Swap in a fuzzy scorer if misses become annoying.
function matcher(query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  return (text: string) => {
    const haystack = text.toLowerCase()
    return words.every(w => haystack.includes(w))
  }
}

export function paletteSections(query: string, ctx: PaletteContext): PaletteSection[] {
  const matches = matcher(query)
  const searching = query.trim() !== ''

  const tasks = searching
    ? [
        ...ctx.tasks.filter(t => matches(t.title)),
        ...ctx.tasks.filter(t => !matches(t.title) && matches(`${t.title} ${t.description}`)),
      ].slice(0, CAP)
    : [...ctx.tasks].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')).slice(0, RECENT)

  const actions: PaletteItem[] = [
    { kind: 'action', key: 'action:new-task', action: 'new-task', label: 'New task', hint: '⌘N' },
    {
      kind: 'action', key: 'action:switch-view', action: 'switch-view',
      label: ctx.currentView === 'status' ? 'Switch to tag view' : 'Switch to status view',
    },
    { kind: 'action', key: 'action:manage-tags', action: 'manage-tags', label: 'Manage tags' },
    { kind: 'action', key: 'action:summaries', action: 'summaries', label: 'View summaries' },
    { kind: 'action', key: 'action:toggle-filters', action: 'toggle-filters', label: 'Toggle filter bar' },
  ]

  const filters: PaletteItem[] = ctx.tags.map(tag => ({
    kind: 'filter', key: `filter:${tag.id}`, tag, label: `Filter: ${tag.name}`, active: ctx.activeTagIds.includes(tag.id),
  }))

  const palettes: PaletteItem[] = [
    { kind: 'palette', key: 'palette:system', paletteId: null, label: 'Palette: Match system', active: ctx.paletteId === null },
    ...ctx.palettes.map((p): PaletteItem => ({
      kind: 'palette', key: `palette:${p.id}`, paletteId: p.id, preview: p.preview, label: `Palette: ${p.name}`, active: ctx.paletteId === p.id,
    })),
  ]

  const byLabel = (items: PaletteItem[]) => items.filter(i => matches(i.label)).slice(0, CAP)

  const taskSection = { heading: searching ? 'Tasks' : 'Recent tasks', items: tasks.map((task): PaletteItem => ({ kind: 'task', key: `task:${task.id}`, task, label: task.title })) }
  const filterSection = { heading: 'Tag filters', items: byLabel(filters) }
  const paletteSection = { heading: 'Palette', items: byLabel(palettes) }

  // Actions first: typing a command's name ("summ", "new") must run it, not open a task that happens to mention the word.
  // A search lists palettes and tag filters before tasks for the same reason ("linear" switches palette); they are
  // only there when their names match. With no query everything is listed, so the recent tasks stay near the top.
  return [
    { heading: 'Actions', items: byLabel(actions) },
    ...(searching ? [paletteSection, filterSection, taskSection] : [taskSection, filterSection, paletteSection]),
  ].filter(section => section.items.length > 0)
}
