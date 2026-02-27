import { extendTheme } from '@chakra-ui/react'

// Colors reference CSS custom properties — automatically switch with color mode
const c = {
  bg: 'var(--c-bg)',
  surface: 'var(--c-surface)',
  card: 'var(--c-card)',
  cardHover: 'var(--c-card-hover)',

  border: 'var(--c-border)',
  borderStrong: 'var(--c-border-strong)',
  borderAccent: 'var(--c-border-accent)',

  text: 'var(--c-text)',
  textSecondary: 'var(--c-text-secondary)',
  textMuted: 'var(--c-text-muted)',

  todo: '#3b82f6',
  todoSoft: 'rgba(59, 130, 246, 0.12)',
  doing: '#f59e0b',
  doingSoft: 'rgba(245, 158, 11, 0.12)',
  done: '#10b981',
  doneSoft: 'rgba(16, 185, 129, 0.12)',

  accent: 'var(--c-accent)',
  accentHover: 'var(--c-accent-hover)',
  accentSoft: 'var(--c-accent-soft)',

  // Pre-computed alpha variants for template literal usage
  accentAlpha40: 'var(--c-accent-a40)',
  accentAlpha10: 'var(--c-accent-a10)',
  cardAlpha80: 'var(--c-card-a80)',
  textMutedAlpha60: 'var(--c-text-muted-a60)',

  danger: '#ef4444',
}

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  fonts: {
    heading: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
    body: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
    mono: `'SF Mono', Menlo, monospace`,
  },
  styles: {
    global: {
      body: {
        bg: c.bg,
        color: c.text,
        fontFamily: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
        minHeight: '100vh',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontFamily: `'Inter', -apple-system, sans-serif`,
        fontWeight: 500,
        borderRadius: '8px',
        fontSize: '0.8rem',
      },
      variants: {
        brutalist: {
          bg: c.accent,
          color: '#fff',
          border: 'none',
          _hover: {
            bg: c.accentHover,
            transform: 'translateY(-1px)',
            boxShadow: `0 4px 12px var(--c-accent-soft)`,
          },
          _active: {
            transform: 'translateY(0)',
          },
        },
        'brutalist-outline': {
          bg: 'transparent',
          color: c.textSecondary,
          border: `1px solid var(--c-border-strong)`,
          _hover: {
            bg: c.surface,
            borderColor: c.borderAccent,
            color: c.text,
          },
        },
        'brutalist-danger': {
          bg: c.danger,
          color: 'white',
          border: 'none',
          _hover: {
            bg: '#dc2626',
          },
        },
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
          fontFamily: `'Inter', -apple-system, sans-serif`,
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
    Input: {
      variants: {
        brutalist: {
          field: {
            border: `1px solid var(--c-border-strong)`,
            borderRadius: '8px',
            bg: c.bg,
            color: c.text,
            fontFamily: `'Inter', -apple-system, sans-serif`,
            fontSize: '0.9rem',
            _focus: {
              borderColor: 'var(--c-focus-outline)',
              boxShadow: '0 0 0 3px var(--c-accent-soft)',
            },
            _placeholder: { color: c.textMuted },
          },
        },
      },
      defaultProps: { variant: 'brutalist' },
    },
    Textarea: {
      variants: {
        brutalist: {
          border: `1px solid var(--c-border-strong)`,
          borderRadius: '8px',
          bg: c.bg,
          color: c.text,
          fontFamily: `'Inter', -apple-system, sans-serif`,
          fontSize: '0.9rem',
          _focus: {
            borderColor: 'var(--c-focus-outline)',
            boxShadow: '0 0 0 3px var(--c-accent-soft)',
          },
          _placeholder: { color: c.textMuted },
        },
      },
      defaultProps: { variant: 'brutalist' },
    },
    Select: {
      variants: {
        brutalist: {
          field: {
            border: `1px solid var(--c-border-strong)`,
            borderRadius: '8px',
            bg: c.bg,
            color: c.text,
            fontFamily: `'Inter', -apple-system, sans-serif`,
            fontSize: '0.9rem',
          },
        },
      },
      defaultProps: { variant: 'brutalist' },
    },
  },
})

export const colors = c
export default theme
