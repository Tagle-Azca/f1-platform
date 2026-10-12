import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import geistLatinUrl from '@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url'
import '@fontsource/barlow/latin-300.css'
import '@fontsource/barlow/latin-400.css'
import '@fontsource/barlow/latin-500.css'
import '@fontsource/barlow/latin-600.css'
import '@fontsource/barlow/latin-700.css'
import '@fontsource/barlow/latin-800.css'
import '@fontsource/barlow-condensed/latin-300.css'
import '@fontsource/barlow-condensed/latin-400.css'
import '@fontsource/barlow-condensed/latin-500.css'
import '@fontsource/barlow-condensed/latin-600.css'
import '@fontsource/barlow-condensed/latin-700.css'
import '@fontsource/barlow-condensed/latin-800.css'
import '@fontsource/barlow-condensed/latin-900.css'
import '@fontsource/barlow-condensed/latin-400-italic.css'
import '@fontsource/barlow-condensed/latin-700-italic.css'
import './styles/fonts.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import './index.css'
import App from './App.jsx'

// Preload the Geist latin face (hashed URL is only known to the bundler, so it is appended here).
const preload = document.createElement('link')
preload.rel = 'preload'
preload.as = 'font'
preload.type = 'font/woff2'
preload.crossOrigin = 'anonymous'
preload.href = geistLatinUrl
document.head.appendChild(preload)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
