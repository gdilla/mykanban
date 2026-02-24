import { extendTheme } from '@chakra-ui/react'

// Dark brutalist color palette
const c = {
  bg: '#1a1a2e',
  bgGrid: '#16213e',
  surface: '#1e1e3a',
  surfaceHover: '#25254a',
  card: '#222244',
  cardHover: '#2a2a55',
  border: '#3a3a5c',
  borderStrong: '#5a5a8c',
  shadow: '#0d0d1a',
  text: '#e8e6f0',
  textSecondary: '#9896b0',
  textMuted: '#6b6988',
  todo: '#ff6b6b',
  todoSoft: '#ff6b6b22',
  doing: '#ffd93d',
  doingSoft: '#ffd93d22',
  done: '#6bcb77',
  doneSoft: '#6bcb7722',
  accent: '#a78bfa',
  accentSoft: '#a78bfa22',
  danger: '#ff4757',
  timeGreen: '#6bcb77',
}

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  fonts: {
    heading: `'Space Grotesk', -apple-system, sans-serif`,
    body: `'JetBrains Mono', 'SF Mono', Menlo, monospace`,
  },
  styles: {
    global: {
      body: {
        bg: c.bg,
        color: c.text,
        fontFamily: `'JetBrains Mono', 'SF Mono', Menlo, monospace`,
        backgroundImage: `
          linear-gradient(90deg, ${c.border}33 1px, transparent 1px),
          linear-gradient(${c.border}33 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        minHeight: '100vh',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontFamily: `'Space Grotesk', -apple-system, sans-serif`,
        fontWeight: 500,
        borderRadius: '0',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontSize: '0.85rem',
      },
      variants: {
        brutalist: {
          bg: c.accent,
          color: '#fff',
          border: '2px solid',
          borderColor: c.borderStrong,
          boxShadow: `3px 3px 0 ${c.shadow}`,
          _hover: {
            transform: 'translate(-2px, -2px)',
            boxShadow: `5px 5px 0 ${c.shadow}`,
            bg: '#b89cfc',
          },
          _active: {
            transform: 'translate(0, 0)',
            boxShadow: `0 0 0 ${c.shadow}`,
          },
        },
        'brutalist-outline': {
          bg: c.surface,
          color: c.text,
          border: '2px solid',
          borderColor: c.borderStrong,
          boxShadow: `3px 3px 0 ${c.shadow}`,
          _hover: {
            transform: 'translate(-2px, -2px)',
            boxShadow: `5px 5px 0 ${c.shadow}`,
            bg: c.surfaceHover,
          },
          _active: {
            transform: 'translate(0, 0)',
            boxShadow: `0 0 0 ${c.shadow}`,
          },
        },
        'brutalist-danger': {
          bg: c.danger,
          color: 'white',
          border: '2px solid',
          borderColor: c.borderStrong,
          boxShadow: `3px 3px 0 ${c.shadow}`,
          _hover: {
            bg: '#ff2234',
            transform: 'translate(-2px, -2px)',
            boxShadow: `5px 5px 0 ${c.shadow}`,
          },
        },
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: c.card,
          border: '3px solid',
          borderColor: c.borderStrong,
          borderRadius: '0',
          boxShadow: `8px 8px 0 ${c.shadow}`,
          color: c.text,
        },
        header: {
          fontFamily: `'Space Grotesk', -apple-system, sans-serif`,
          fontWeight: 700,
          fontSize: '1.5rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          borderBottom: '2px solid',
          borderColor: c.borderStrong,
          pb: 4,
          color: c.text,
        },
        body: {
          pt: 6,
        },
        footer: {
          borderTop: `1px dashed ${c.border}`,
          pt: 5,
        },
        closeButton: {
          color: c.textSecondary,
          _hover: { color: c.text },
        },
      },
    },
    Input: {
      variants: {
        brutalist: {
          field: {
            border: '2px solid',
            borderColor: c.borderStrong,
            borderRadius: '0',
            bg: c.bg,
            color: c.text,
            fontFamily: `'JetBrains Mono', monospace`,
            fontSize: '0.9rem',
            _focus: {
              boxShadow: `3px 3px 0 ${c.shadow}`,
              borderColor: c.accent,
            },
            _placeholder: { color: c.textMuted },
          },
        },
      },
      defaultProps: {
        variant: 'brutalist',
      },
    },
    Textarea: {
      variants: {
        brutalist: {
          border: '2px solid',
          borderColor: c.borderStrong,
          borderRadius: '0',
          bg: c.bg,
          color: c.text,
          fontFamily: `'JetBrains Mono', monospace`,
          fontSize: '0.9rem',
          _focus: {
            boxShadow: `3px 3px 0 ${c.shadow}`,
            borderColor: c.accent,
          },
          _placeholder: { color: c.textMuted },
        },
      },
      defaultProps: {
        variant: 'brutalist',
      },
    },
    Select: {
      variants: {
        brutalist: {
          field: {
            border: '2px solid',
            borderColor: c.borderStrong,
            borderRadius: '0',
            bg: c.bg,
            color: c.text,
            fontFamily: `'JetBrains Mono', monospace`,
            fontSize: '0.9rem',
          },
        },
      },
      defaultProps: {
        variant: 'brutalist',
      },
    },
  },
})

// Export colors for direct use in components
export const colors = c

export default theme
