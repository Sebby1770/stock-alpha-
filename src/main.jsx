import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ResearchProvider } from './context/ResearchContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ResearchProvider>
      <App />
    </ResearchProvider>
  </React.StrictMode>,
)
