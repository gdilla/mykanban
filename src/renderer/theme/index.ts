import { extendTheme } from '@chakra-ui/react'

// Colours reference the CSS custom properties in global.css, so they switch with the active palette.
// palettes.test.ts keeps every text colour here at 4.5:1 or better on bg, surface, card and cardHover.
const soft = (token: string) => `color-mix(in srgb, var(${token}) 12%, transparent)`

const c = {
  // Surfaces, darkest to lightest on dark palettes: page, header and panels, cards
  bg: 'var(--c-bg)',
  surface: 'var(--c-surface)',
  card: 'var(--c-card)',
  cardHover: 'var(--c-card-hover)',

  border: 'var(--c-border)',
  borderStrong: 'var(--c-border-strong)',
  borderAccent: 'var(--c-border-accent)',

  // Text: titles, then descriptions and control labels, then counts, hints and meta
  text: 'var(--c-text)',
  textSecondary: 'var(--c-text-secondary)',
  textMuted: 'var(--c-text-muted)',

  // Status colours, safe as text and as dots
  todo: 'var(--c-todo)',
  todoSoft: soft('--c-todo'),
  doing: 'var(--c-doing)',
  doingSoft: soft('--c-doing'),
  done: 'var(--c-done)',
  doneSoft: soft('--c-done'),

  // Accent is decoration only (focus rings, selection tints). It is not legible as text or
  // behind text in every palette: use accentText for text and the primary* trio for filled buttons.
  accent: 'var(--c-accent)',
  accentHover: 'var(--c-accent-hover)',
  accentSoft: 'var(--c-accent-soft)',
  accentText: 'var(--c-accent-text)',

  // Filled primary button: background, label, hover background
  primaryBg: 'var(--c-save-btn-bg)',
  primaryText: 'var(--c-save-btn-color)',
  primaryHover: 'var(--c-save-btn-hover)',

  // Pre-computed alpha variants for template literal usage
  accentAlpha40: 'var(--c-accent-a40)',
  accentAlpha10: 'var(--c-accent-a10)',
  cardAlpha80: 'var(--c-card-a80)',
  textMutedAlpha60: 'var(--c-text-muted-a60)',

  // danger is red text or a red indicator; dangerSolid is the fill of a destructive button (white label)
  danger: 'var(--c-danger)',
  dangerSolid: '#dc2626',
}

const font = `-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, sans-serif`

const primaryButton = {
  bg: c.primaryBg,
  color: c.primaryText,
  border: 'none',
  _hover: { bg: c.primaryHover },
}
const secondaryButton = {
  bg: 'transparent',
  color: c.textSecondary,
  border: `1px solid var(--c-border-strong)`,
  _hover: {
    bg: c.surface,
    borderColor: c.borderAccent,
    color: c.text,
  },
}
const dangerButton = {
  bg: c.dangerSolid,
  color: '#fff',
  border: 'none',
  _hover: { bg: '#b91c1c' },
}

const field = {
  border: `1px solid var(--c-border-strong)`,
  borderRadius: '8px',
  bg: c.bg,
  color: c.text,
  fontSize: '0.9rem',
}
const fieldFocus = {
  borderColor: 'var(--c-focus-outline)',
  boxShadow: '0 0 0 3px var(--c-accent-soft)',
}

const theme = extendTheme({
  config: {
    // The palette decides light or dark (see usePalette); Chakra's own switch stays out of it.
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  fonts: {
    heading: font,
    body: font,
    mono: `'SF Mono', Menlo, monospace`,
  },
  styles: {
    global: {
      body: {
        bg: c.bg,
        color: c.text,
        fontSize: '13px',
        minHeight: '100vh',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 500,
        borderRadius: '8px',
      },
      sizes: {
        xs: { fontSize: '12px' },
        sm: { fontSize: '13px' },
        md: { fontSize: '13px', h: '32px', px: 4 },
      },
      variants: {
        primary: primaryButton,
        secondary: secondaryButton,
        danger: dangerButton,
        // ponytail: old names kept as aliases because the modals still use them; delete once T9 has migrated.
        brutalist: primaryButton,
        'brutalist-outline': secondaryButton,
        'brutalist-danger': dangerButton,
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: c.surface,
          border: `1px solid var(--c-border-strong)`,
          borderRadius: '12px',
          boxShadow: `0 24px 48px rgba(0,0,0,0.25)`,
          color: c.text,
        },
        header: {
          fontWeight: 600,
          fontSize: '1.1rem',
          borderBottom: `1px solid var(--c-border)`,
          pb: 4,
          color: c.text,
        },
        body: {
          pt: 6,
        },
        footer: {
          borderTop: `1px solid var(--c-border)`,
          pt: 5,
        },
        closeButton: {
          color: c.textSecondary,
          _hover: { color: c.text, bg: c.card },
        },
      },
    },
    Menu: {
      baseStyle: {
        list: {
          bg: c.surface,
          border: `1px solid var(--c-border-strong)`,
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          p: '4px',
          minW: '180px',
        },
        item: {
          bg: 'transparent',
          color: c.textSecondary,
          borderRadius: '6px',
          fontSize: '13px',
          px: '8px',
          py: '6px',
          _hover: { bg: c.card, color: c.text },
          _focus: { bg: c.card, color: c.text },
          _checked: { color: c.text, fontWeight: 500 },
        },
      },
    },
    Input: {
      variants: {
        brutalist: {
          field: { ...field, _focus: fieldFocus, _placeholder: { color: c.textMuted } },
        },
      },
      defaultProps: { variant: 'brutalist' },
    },
    Textarea: {
      variants: {
        brutalist: { ...field, _focus: fieldFocus, _placeholder: { color: c.textMuted } },
      },
      defaultProps: { variant: 'brutalist' },
    },
    Select: {
      variants: {
        brutalist: { field },
      },
      defaultProps: { variant: 'brutalist' },
    },
  },
})

export const colors = c
export default theme
