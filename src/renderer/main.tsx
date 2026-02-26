import React from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import { SaasProvider } from '@saas-ui/react'
import theme from './theme'
import { AppProvider } from './state/AppContext'
import App from './App'
import './global.css'

const root = createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <ColorModeScript initialColorMode="dark" />
    <ChakraProvider theme={theme}>
      <SaasProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </SaasProvider>
    </ChakraProvider>
  </React.StrictMode>
)
