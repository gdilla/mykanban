import React, { useSyncExternalStore } from 'react'
import { Box, Flex, chakra } from '@chakra-ui/react'
import { X } from 'lucide-react'
import { colors as c } from '../../theme'
import { isHex, tagTextColor, TAG_TINT } from '../../utils/color'

// The one tag pill. Selected = the tag's name in its tag colour on a tinted fill of that colour;
// unselected = muted text in a muted outline. On a card: <TagChip name={tag.name} color={tag.color} size="sm" />.

interface TagChipProps {
  name: string
  /** The tag's own colour (`#rrggbb`, user data). */
  color: string
  /** Tinted fill (default) or muted outline. */
  selected?: boolean
  /** `sm` (18px tall, 11px text) for cards; `md` (24px, 12px) in dialogs and the filter bar. */
  size?: 'sm' | 'md'
  /** Makes the chip a toggle button. */
  onClick?: () => void
  /** Adds a small remove (×) button after the name. */
  onRemove?: () => void
}

// The chip's text colour depends on the active palette's surfaces, which exist only as CSS variables:
// read them from the document, and re-render every chip when the palette changes.
const SURFACES = ['--c-bg', '--c-surface', '--c-card', '--c-card-hover']
const root = document.documentElement
const listeners = new Set<() => void>()
const textColors = new Map<string, string>() // `${palette} ${tag colour}` -> text colour

new MutationObserver(() => listeners.forEach(notify => notify())).observe(root, { attributeFilter: ['data-palette'] })
const subscribe = (notify: () => void) => {
  listeners.add(notify)
  return () => void listeners.delete(notify)
}
const paletteId = () => root.getAttribute('data-palette') ?? ''

function textColor(palette: string, color: string): string {
  const key = `${palette} ${color}`
  let text = textColors.get(key)
  if (!text) {
    const style = getComputedStyle(root)
    const surfaces = SURFACES.map(v => style.getPropertyValue(v).trim()).filter(isHex)
    // A colour or palette that is not plain hex cannot be measured: use ordinary secondary text.
    text = isHex(color) && surfaces.length ? tagTextColor(color, surfaces) : c.textSecondary
    textColors.set(key, text)
  }
  return text
}

const alpha = (color: string, fraction: number) => `color-mix(in srgb, ${color} ${fraction * 100}%, transparent)`

export default function TagChip({ name, color, selected = true, size = 'md', onClick, onRemove }: TagChipProps) {
  const palette = useSyncExternalStore(subscribe, paletteId)
  const text = textColor(palette, color)
  const sm = size === 'sm'
  const pad = sm ? '7px' : '10px'
  const nameStyle = {
    minW: 0, pl: pad, pr: onRemove ? '4px' : pad, borderRadius: 'full',
    lineHeight: sm ? '16px' : '22px',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
    _focusVisible: { outline: '2px solid var(--c-focus-outline)', outlineOffset: '1px' },
  }

  return (
    <Flex
      as="span" display="inline-flex" align="center" flexShrink={0} maxW="100%"
      h={sm ? '18px' : '24px'} borderRadius="full"
      fontSize={sm ? '11px' : '12px'} fontWeight={500} lineHeight={1}
      color={selected ? text : c.textSecondary}
      bg={selected ? alpha(color, TAG_TINT) : 'transparent'}
      border="1px solid" borderColor={selected ? alpha(color, 0.4) : c.borderStrong}
      transition="background-color 0.12s ease, border-color 0.12s ease, color 0.12s ease"
      // Hovering a chip that is off previews it on
      _hover={onClick && !selected ? { color: text, bg: alpha(color, TAG_TINT / 2), borderColor: alpha(color, 0.4) } : undefined}
    >
      {onClick
        ? <chakra.button type="button" aria-pressed={selected} onClick={onClick} cursor="pointer" {...nameStyle}>{name}</chakra.button>
        : <chakra.span {...nameStyle}>{name}</chakra.span>}
      {onRemove && (
        <Box
          as="button" type="button" aria-label={`Remove ${name}`} onClick={onRemove}
          h="100%" pl="2px" pr={sm ? '5px' : '7px'} borderRadius="full"
          display="inline-flex" alignItems="center" cursor="pointer" opacity={0.7}
          _hover={{ opacity: 1 }}
          _focusVisible={{ outline: '2px solid var(--c-focus-outline)', outlineOffset: '1px' }}
        >
          <X size={sm ? 10 : 12} />
        </Box>
      )}
    </Flex>
  )
}
