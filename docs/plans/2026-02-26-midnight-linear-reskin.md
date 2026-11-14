# Midnight Linear Reskin

## Palette
- bg: `#0f1117` — deepest layer
- surface: `#1a1d27` — panels, filter bar, column headers
- card: `#232733` — task cards
- cardHover: `#2a2e3d`
- accent: `#7c8aff` — buttons, focus states
- accentHover: `#6b79f0`
- text: `#e2e4e9` — primary text
- textSecondary: `#8b8fa3` — descriptions, secondary info
- textMuted: `#5a5f72` — dates, counts, hints
- border: `#2a2e3d` — subtle dividers where needed
- borderStrong: `#353a4a`
- todo: `#f87171` (softer red)
- doing: `#fbbf24` (warm amber)
- done: `#34d399` (emerald)
- danger: `#ef4444`

## Card Design
- No visible border, no left accent bar
- Soft shadow: `0 1px 3px rgba(0,0,0,0.3)`, hover: `0 4px 12px rgba(0,0,0,0.4)`
- Small colored status dot before title (replaces left bar)
- Title: 0.9rem, weight 500, primary text color
- Description: 0.8rem, weight 400, secondary text color, 2 lines max
- No separator line between content and meta — just spacing
- Tags as tiny pills, meta in muted text
- Quick actions appear on hover (bottom-right)
- borderRadius: 10px, padding: 14px 16px

## Global Changes
- Remove grid background pattern from body
- Font: Inter / -apple-system (drop Space Grotesk + JetBrains Mono)
- No uppercase headers anywhere — sentence case
- Column headers: sentence case, muted count badge
- Inputs use system font, not monospace

## Files to Change
1. `src/renderer/theme/index.ts` — full palette + component overrides
2. `src/renderer/global.css` — remove grid, update card hover/focus styles, font import
3. `src/renderer/components/task/TaskCard.tsx` — status dot, remove left bar, shadow
4. `src/renderer/components/task/TaskTitle.tsx` — title styling
5. `src/renderer/components/task/TaskBadges.tsx` — muted styling
6. `src/renderer/components/task/TaskTags.tsx` — tiny pill style
7. `src/renderer/components/board/Column.tsx` — header styling
8. `src/renderer/components/layout/Header.tsx` — sentence case, subtler kbd hints
9. `src/renderer/index.html` — swap font import
