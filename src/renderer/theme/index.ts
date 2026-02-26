import { extendTheme } from '@chakra-ui/react'

// Proper dark theme with clear visual layers
// bg (darkest) → surface (mid) → card (lightest) = clear depth
const c = {
  // Layered backgrounds — each step lighter for depth
  bg: '#0c0c0c',            // true dark
  surface: '#161616',       // panels, filter bar
  card: '#1e1e1e',          // task cards — clearly pops off bg
  cardHover: '#262626',     // hover state

  // Borders — visible but not harsh
  border: '#2a2a2a',
  borderStrong: '#3d3d3d',
  borderAccent: '#4a4a4a',

  // Shadow
  shadow: '#000000',

  // Text — good contrast on dark
  text: '#ececec',
  textSecondary: '#a0a0a0',
  textMuted: '#666666',

  // Status colors — vivid, high contrast on dark
  todo: '#ff5c5c',
  todoSoft: 'rgba(255, 92, 92, 0.12)',
  doing: '#ffb347',
  doingSoft: 'rgba(255, 179, 71, 0.12)',
  done: '#4ade80',
  doneSoft: 'rgba(74, 222, 128, 0.12)',

  // Accent
  accent: '#818cf8',        // indigo — buttons, focus, active states
  accentHover: '#6366f1',
  accentSoft: 'rgba(129, 140, 248, 0.15)',

  // Misc
  danger: '#ef4444',
}

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  fonts: {
    heading: `'Space Grotesk', -apple-system, sans-serif`,
    body: `'Space Grotesk', -apple-system, sans-serif`,
    mono: `'JetBrains Mono', 'SF Mono', Menlo, monospace`,
  },
  styles: {
    global: {
      body: {
        bg: c.bg,
        color: c.text,
        fontFamily: `'Space Grotesk', -apple-system, sans-serif`,
        backgroundImage: `
          linear-gradient(90deg, ${c.border}55 1px, transparent 1px),
          linear-gradient(${c.border}55 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
        minHeight: '100vh',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontFamily: `'Space Grotesk', -apple-system, sans-serif`,
        fontWeight: 600,
        borderRadius: '6px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
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
            boxShadow: `0 4px 12px ${c.accent}44`,
          },
          _active: {
            transform: 'translateY(0)',
          },
        },
        'brutalist-outline': {
          bg: 'transparent',
          color: c.text,
          border: `1px solid ${c.borderStrong}`,
          _hover: {
            bg: c.surface,
            borderColor: c.borderAccent,
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
          border: `1px solid ${c.borderStrong}`,
          borderRadius: '12px',
          boxShadow: `0 24px 48px rgba(0,0,0,0.5)`,
          color: c.text,
        },
        header: {
          fontFamily: `'Space Grotesk', -apple-system, sans-serif`,
          fontWeight: 700,
          fontSize: '1.3rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          borderBottom: `1px solid ${c.border}`,
          pb: 4,
          color: c.text,
        },
        body: {
          pt: 6,
        },
        footer: {
          borderTop: `1px solid ${c.border}`,
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
            border: `1px solid ${c.borderStrong}`,
            borderRadius: '6px',
            bg: c.bg,
            color: c.text,
            fontFamily: `'JetBrains Mono', monospace`,
            fontSize: '0.9rem',
            _focus: {
              borderColor: c.accent,
              boxShadow: `0 0 0 1px ${c.accent}`,
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
          border: `1px solid ${c.borderStrong}`,
          borderRadius: '6px',
          bg: c.bg,
          color: c.text,
          fontFamily: `'JetBrains Mono', monospace`,
          fontSize: '0.9rem',
          _focus: {
            borderColor: c.accent,
            boxShadow: `0 0 0 1px ${c.accent}`,
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
            border: `1px solid ${c.borderStrong}`,
            borderRadius: '6px',
            bg: c.bg,
            color: c.text,
            fontFamily: `'JetBrains Mono', monospace`,
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
