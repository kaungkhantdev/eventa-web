import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App'
import { recoverFromStaleChunks } from './lib/staleChunks'

// Before React, because a chunk can fail before anything has rendered.
recoverFromStaleChunks()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
