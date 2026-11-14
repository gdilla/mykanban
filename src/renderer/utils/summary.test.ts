import { describe, it, expect } from 'vitest'
import { formatSummary, summaryDate } from './summary'

describe('formatSummary', () => {
  it('turns #, ## and ### lines into headings', () => {
    expect(formatSummary('# Daily Summary - 2026-03-04\n## 📊 Overview\n### webapp')).toEqual([
      { type: 'heading', level: 1, text: 'Daily Summary - 2026-03-04' },
      { type: 'heading', level: 2, text: '📊 Overview' },
      { type: 'heading', level: 3, text: 'webapp' },
    ])
  })

  it('drops the colon main.js puts after some sub-headings', () => {
    expect(formatSummary('### Overdue (tackle first!):')).toEqual([
      { type: 'heading', level: 3, text: 'Overdue (tackle first!)' },
    ])
  })

  it('groups consecutive "- " lines into one list', () => {
    expect(formatSummary('- Total tasks: 43\n- To Do: 21\n\n- Done: 19')).toEqual([
      { type: 'list', items: [[{ text: 'Total tasks: 43' }], [{ text: 'To Do: 21' }]] },
      { type: 'list', items: [[{ text: 'Done: 19' }]] },
    ])
  })

  it('a heading ends the list before it', () => {
    expect(formatSummary('- one\n### Due Tomorrow:\n- two').map(b => b.type)).toEqual(['list', 'heading', 'list'])
  })

  it('marks **bold** runs inside paragraphs and list items', () => {
    expect(formatSummary('**Total:** 10h 10m')).toEqual([
      { type: 'paragraph', text: [{ text: 'Total:', bold: true }, { text: ' 10h 10m' }] },
    ])
    expect(formatSummary('- a **b** c')).toEqual([
      { type: 'list', items: [[{ text: 'a ' }, { text: 'b', bold: true }, { text: ' c' }]] },
    ])
  })

  it('leaves unmatched asterisks and other markdown-looking text alone', () => {
    expect(formatSummary('2 * 3 ** 4 and [In progress: 8d]')).toEqual([
      { type: 'paragraph', text: [{ text: '2 * 3 ** 4 and [In progress: 8d]' }] },
    ])
    expect(formatSummary('- Fix #123 - not a heading')).toEqual([
      { type: 'list', items: [[{ text: 'Fix #123 - not a heading' }]] },
    ])
  })

  it('makes --- a rule and each other line its own paragraph', () => {
    expect(formatSummary('\n---\nData stored at: /a/b\nSummaries stored at: /a/c\n')).toEqual([
      { type: 'rule' },
      { type: 'paragraph', text: [{ text: 'Data stored at: /a/b' }] },
      { type: 'paragraph', text: [{ text: 'Summaries stored at: /a/c' }] },
    ])
  })

  it('returns nothing for an empty summary and survives Windows line endings', () => {
    expect(formatSummary('')).toEqual([])
    expect(formatSummary('# A\r\n- b\r\n')).toEqual([
      { type: 'heading', level: 1, text: 'A' },
      { type: 'list', items: [[{ text: 'b' }]] },
    ])
  })

  it('formats a whole generated summary', () => {
    const blocks = formatSummary([
      '# Daily Summary - 2026-03-04', '', 'Generated at 9:00:08 PM', '',
      '## ✅ Completed Today', 'No tasks marked complete today.', '',
      '## 📅 Tomorrow\'s Priorities', '### Continue working on:', '- Wireframe moving devices', '',
      '## 🏷️ By Tag', '', '### webapp', '- Total: 9 (Done: 3, In Progress: 2, To Do: 3)', '', '', '---', 'Data stored at: /x',
    ].join('\n'))
    expect(blocks.map(b => b.type)).toEqual([
      'heading', 'paragraph', 'heading', 'paragraph', 'heading', 'heading', 'list', 'heading', 'heading', 'list', 'rule', 'paragraph',
    ])
  })
})

describe('summaryDate', () => {
  it('reads the local date out of a summary file name', () => {
    expect(summaryDate('summary-2026-03-04.md')).toEqual(new Date(2026, 2, 4))
  })
  it('is null for any other file name', () => {
    expect(summaryDate('notes.md')).toBeNull()
  })
})
