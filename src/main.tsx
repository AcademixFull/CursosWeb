import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App.tsx'
import { initializeAuthRedirect } from './utils/passwordRecovery.ts'
import { registerPwa } from './offline/register.ts'

initializeAuthRedirect()
registerPwa()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
