import React from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import { MotionConfig } from 'framer-motion'
import theme from './theme'
import { AppProvider } from './state/AppContext'
import App from './App'
import './global.css'

const root = createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      {/* Chakra's dialogs and menus animate with framer-motion; this makes them honour "Reduce motion" */}
      <MotionConfig reducedMotion="user">
        <AppProvider>
          <App />
        </AppProvider>
      </MotionConfig>
    </ChakraProvider>
  </React.StrictMode>
)
