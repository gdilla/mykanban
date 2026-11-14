// Formats a daily summary for display. Summaries are written by generateDailySummary in main.js,
// which emits only: #, ## and ### headings, "- " bullets, **bold**, a --- rule and plain lines.
// ponytail: handles exactly those constructs, not markdown in general (no links, nested lists,
// numbered lists or code). Swap in a markdown library if summaries ever become free-form.

export type Inline = { text: string; bold?: true }

export type Block =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'list'; items: Inline[][] }
  | { type: 'paragraph'; text: Inline[] }
  | { type: 'rule' }

function inline(text: string): Inline[] {
  // Odd pieces of the split are the insides of **…** pairs
  return text.split(/\*\*(.+?)\*\*/).flatMap((piece, i): Inline[] =>
    piece ? [i % 2 ? { text: piece, bold: true } : { text: piece }] : [])
}

export function formatSummary(markdown: string): Block[] {
  const blocks: Block[] = []
  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trim()
    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    const last = blocks[blocks.length - 1]
    if (!line) {
      // A blank line ends the current list: the next bullet starts a new one
      if (last?.type === 'list') blocks.push({ type: 'paragraph', text: [] })
    } else if (heading) {
      blocks.push({ type: 'heading', level: Math.min(heading[1].length, 3) as 1 | 2 | 3, text: heading[2].replace(/:$/, '') })
    } else if (line.startsWith('- ')) {
      if (last?.type === 'list') last.items.push(inline(line.slice(2)))
      else blocks.push({ type: 'list', items: [inline(line.slice(2))] })
    } else if (/^-{3,}$/.test(line)) {
      blocks.push({ type: 'rule' })
    } else {
      blocks.push({ type: 'paragraph', text: inline(line) })
    }
  }
  // The empty paragraphs were only list separators
  return blocks.filter(b => b.type !== 'paragraph' || b.text.length > 0)
}

/** The local date a summary file is for (`summary-YYYY-MM-DD.md`), or null for any other name. */
export function summaryDate(filename: string): Date | null {
  const m = filename.match(/^summary-(\d{4})-(\d{2})-(\d{2})\.md$/)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null
}
