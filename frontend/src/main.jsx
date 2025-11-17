import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // ⬅️ App.jsx를 불러옴
import './index.css'     // ⬅️ index.css를 불러옴

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)