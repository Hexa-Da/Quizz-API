import { useState } from 'react'
import './App.css'

function App() {
  const [quote, setQuote] = useState('')

  return (
    <div className="app">
      <div className="quote-box">
        <p className="quote-text">
          {quote || 'Cliquez sur un bouton pour obtenir une citation'}
        </p>
      </div>
      
      <div className="buttons-container">
        <button className="success-button">Nouvelle citation</button>
        <button className="error-button">Autre action</button>
      </div>
    </div>
  )
}

export default App
