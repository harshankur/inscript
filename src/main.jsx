import React from 'react'
import ReactDOM from 'react-dom/client'
import InscriptApp from './App.jsx'
// inscript-editor no longer bundles KaTeX styles (katex is an optional peer). Imported here
// rather than from index.css so Vite resolves the stylesheet's font urls and publishes the
// fonts with it.
import 'katex/dist/katex.min.css'
import './index.css'
import './i18n'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <InscriptApp />
    </React.StrictMode>,
)
