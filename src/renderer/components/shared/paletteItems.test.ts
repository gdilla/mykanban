import { describe, it, expect } from 'vitest'
import { paletteSections, PaletteContext } from './paletteItems'
import { Task } from '../../state/types'

const task = (id: string, title: string, extra: Partial<Task> = {}): Task => ({
  id, title, description: '', status: 'todo', dueDate: '', tags: [], attachments: [],
  createdAt: `2026-01-${id.padStart(2, '0')}T10:00:00.000Z`, startedAt: null, completedAt: null,
  timeSpent: 0, sortOrder: 0, tagSortOrders: {}, ...extra,
})

const ctx: PaletteContext = {
  tasks: [
    task('1', 'Wireframe BACnet support'),
    task('2', 'Floorplan view in kiosk'),
    task('3', 'Write requirements', { description: 'Portfolio scorecards, wireframe later' }),
    task('4', 'Look at roadmap', { status: 'done' }),
    task('5', 'Signal survey'),
    task('6', 'Null state design'),
    task('7', 'New tag colours'),
  ],
  tags: [
    { id: 't1', name: 'webapp', color: '#6bcb77' },
    { id: 't2', name: 'Kiosk', color: '#a855f7' },
  ],
  activeTagIds: ['t2'],
  currentView: 'status',
  palettes: [
    { id: 'linear', name: 'Linear', preview: '#5e6ad2' },
    { id: 'notion', name: 'Notion', preview: '#37352f' },
  ],
  paletteId: 'linear',
}

const labels = (query: string, c = ctx) =>
  Object.fromEntries(paletteSections(query, c).map(s => [s.heading, s.items.map(i => i.label)]))

describe('paletteSections', () => {
  it('with no query: the five newest tasks, every action, every tag filter and every palette', () => {
    expect(labels('')).toEqual({
      'Recent tasks': ['New tag colours', 'Null state design', 'Signal survey', 'Look at roadmap', 'Write requirements'],
      Actions: ['New task', 'Switch to tag view', 'Manage tags', 'View summaries', 'Toggle filter bar'],
      'Tag filters': ['Filter: webapp', 'Filter: Kiosk'],
      Palette: ['Palette: Match system', 'Palette: Linear', 'Palette: Notion'],
    })
  })

  it('a task with no createdAt (old data, a hand edit) is listed last instead of throwing', () => {
    const undated = { ...task('9', 'Undated'), createdAt: undefined } as unknown as Task
    const tasks = [undated, ...ctx.tasks.slice(0, 3)]
    expect(labels('', { ...ctx, tasks })['Recent tasks']).toEqual(['Write requirements', 'Floorplan view in kiosk', 'Wireframe BACnet support', 'Undated'])
  })

  it('lists actions first, then tasks, tag filters and palettes', () => {
    expect(paletteSections('', ctx).map(s => s.heading)).toEqual(['Actions', 'Recent tasks', 'Tag filters', 'Palette'])
    expect(paletteSections('a', ctx).map(s => s.heading)).toEqual(['Actions', 'Tasks', 'Tag filters', 'Palette'])
  })

  it('a command name runs the command, even when tasks match the same words', () => {
    const withTask = { ...ctx, tasks: [...ctx.tasks, task('8', 'Use AI to summarize research', { description: 'manage tags better' })] }
    expect(paletteSections('summ', withTask)[0].items[0].label).toBe('View summaries')
    expect(paletteSections('manage', withTask)[0].items[0].label).toBe('Manage tags')
  })

  it('offers the view that is not on screen', () => {
    expect(labels('switch', { ...ctx, currentView: 'tags' }).Actions).toEqual(['Switch to status view'])
  })

  it('matches tasks by title or description, title matches first, ignoring case', () => {
    expect(labels('WIREFRAME').Tasks).toEqual(['Wireframe BACnet support', 'Write requirements'])
  })

  it('needs every word of the query, in any order', () => {
    expect(labels('kiosk floorplan').Tasks).toEqual(['Floorplan view in kiosk'])
    expect(labels('kiosk roadmap').Tasks).toBeUndefined()
  })

  it('searches actions, tag filters and palettes with the same query, leaving out empty sections', () => {
    expect(labels('tag')).toEqual({
      Tasks: ['New tag colours'],
      Actions: ['Switch to tag view', 'Manage tags'],
    })
    expect(labels('filter kio')).toEqual({ 'Tag filters': ['Filter: Kiosk'] })
    expect(labels('notion')).toEqual({ Palette: ['Palette: Notion'] })
    expect(labels('match system')).toEqual({ Palette: ['Palette: Match system'] })
  })

  it('returns no sections when nothing matches', () => {
    expect(paletteSections('zzzz', ctx)).toEqual([])
  })

  it('caps every section at eight results', () => {
    const many: PaletteContext = {
      ...ctx,
      tasks: Array.from({ length: 30 }, (_, i) => task(String(i + 1), `Task ${i + 1}`)),
      tags: Array.from({ length: 12 }, (_, i) => ({ id: `t${i}`, name: `tag ${i}`, color: '#3b82f6' })),
    }
    const sections = paletteSections('ta', many)
    expect(sections.find(s => s.heading === 'Tasks')!.items).toHaveLength(8)
    expect(sections.find(s => s.heading === 'Tag filters')!.items).toHaveLength(8)
  })

  it('marks the tag filters that are on and the palette in use', () => {
    const sections = paletteSections('', ctx)
    const active = (heading: string) => sections.find(s => s.heading === heading)!.items
      .filter(i => (i.kind === 'filter' || i.kind === 'palette') && i.active).map(i => i.label)
    expect(active('Tag filters')).toEqual(['Filter: Kiosk'])
    expect(active('Palette')).toEqual(['Palette: Linear'])
    const system = paletteSections('', { ...ctx, paletteId: null }).find(s => s.heading === 'Palette')!.items
    expect(system.filter(i => i.kind === 'palette' && i.active).map(i => i.label)).toEqual(['Palette: Match system'])
  })

  it('gives every item a key that is unique across sections', () => {
    const keys = paletteSections('', ctx).flatMap(s => s.items.map(i => i.key))
    expect(new Set(keys).size).toBe(keys.length)
  })
})
