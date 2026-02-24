import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  fonts: {
    heading: `'Space Grotesk', sans-serif`,
    body: `'Space Mono', monospace`,
  },
  colors: {
    brand: {
      bg: '#f5f0eb',
      surface: '#fffdf9',
      text: '#2d2a26',
      textSecondary: '#7a756e',
      shadow: '#2d2a26',
      border: 'rgba(45, 42, 38, 0.15)',
      accent: '#e74c3c',
      accentHover: '#c0392b',
      success: '#27ae60',
      warning: '#f39c12',
      doing: '#3498db',
    },
  },
  styles: {
    global: {
      '@import': [
        "url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap')",
      ],
      body: {
        bg: 'brand.bg',
        color: 'brand.text',
        fontFamily: 'body',
        backgroundImage: `
          linear-gradient(rgba(45,42,38,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(45,42,38,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '24px 24px',
      },
    },
  },
  components: {
    Card: {
      baseStyle: {
        container: {
          bg: 'brand.surface',
          border: '2px solid',
          borderColor: 'brand.shadow',
          borderRadius: '0',
          boxShadow: '4px 4px 0 var(--chakra-colors-brand-shadow)',
          transition: 'all 0.15s ease',
          _hover: {
            transform: 'translate(-2px, -2px)',
            boxShadow: '6px 6px 0 var(--chakra-colors-brand-shadow)',
          },
        },
      },
    },
    Button: {
      baseStyle: {
        fontFamily: 'heading',
        fontWeight: 700,
        borderRadius: '0',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      },
      variants: {
        brutalist: {
          bg: 'brand.text',
          color: 'white',
          border: '2px solid',
          borderColor: 'brand.shadow',
          _hover: {
            transform: 'translate(-1px, -1px)',
            boxShadow: '3px 3px 0 var(--chakra-colors-brand-shadow)',
          },
        },
        'brutalist-outline': {
          bg: 'transparent',
          border: '2px solid',
          borderColor: 'brand.shadow',
          _hover: {
            bg: 'brand.bg',
          },
        },
        'brutalist-danger': {
          bg: 'brand.accent',
          color: 'white',
          border: '2px solid',
          borderColor: 'brand.shadow',
          _hover: {
            bg: 'brand.accentHover',
          },
        },
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: 'brand.surface',
          border: '3px solid',
          borderColor: 'brand.shadow',
          borderRadius: '0',
          boxShadow: '8px 8px 0 var(--chakra-colors-brand-shadow)',
        },
        header: {
          fontFamily: 'heading',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          borderBottom: '2px solid',
          borderColor: 'brand.shadow',
        },
        footer: {
          borderTop: '1px dashed',
          borderColor: 'brand.border',
        },
      },
    },
    Badge: {
      baseStyle: {
        fontFamily: 'heading',
        borderRadius: '0',
        fontWeight: 700,
        textTransform: 'uppercase',
        fontSize: '0.65rem',
        letterSpacing: '0.05em',
      },
    },
  },
})

export default theme
