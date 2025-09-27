// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './components/App'

// Initialize React app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('react-root')
  if (container) {
    const root = ReactDOM.createRoot(container)
    root.render(<App />)
  }
})