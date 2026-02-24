import React from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import { SaasProvider } from '@saas-ui/react'
import theme from './theme'
import { AppProvider } from './state/AppContext'
import App from './App'
import './global.css'

const root = createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <SaasProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </SaasProvider>
    </ChakraProvider>
  </React.StrictMode>
)
