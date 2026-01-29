import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [quoteData, setQuoteData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showResult, setShowResult] = useState(false)

  function fetchQuote() {
    setIsLoading(true)
    setSelectedAnswer(null)
    setShowResult(false)
    
    fetch('http://localhost:3000/api/quote')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
      })
      .then(data => {
        console.log('Données reçues:', data)
        if (data && data.options && Array.isArray(data.options)) {
          setQuoteData(data)
        } else {
          console.error('Format de données invalide:', data)
          setQuoteData(null)
        }
        setIsLoading(false)
      })
      .catch(error => {
        console.error('Erreur lors du fetch:', error)
        setQuoteData(null)
        setIsLoading(false)
      })
  }

  useEffect(() => {
    fetchQuote()
  }, [])

  function handleChoice(choice) {
    if (showResult) return // Empêcher de cliquer plusieurs fois
    
    setSelectedAnswer(choice)
    setShowResult(true)
  }

  function handleNextQuote() {
    fetchQuote()
  }

  if (isLoading) {
    return (
      <div className="app">
        <div className="loading">Chargement...</div>
      </div>
    )
  }

  if (!quoteData || !quoteData.options) {
    return (
      <div className="app">
        <div className="error">Erreur lors du chargement</div>
      </div>
    )
  }

  const isCorrect = selectedAnswer === quoteData.correctAnswer

  return (
    <div className="app">
      <div className="quote-box">
        <p className="quote-text">
          {quoteData.text}
        </p>
        {showResult && (
          <div className={`result-message ${isCorrect ? 'correct' : 'incorrect'}`}>
            {isCorrect ? (
              <span>✅ Correct ! La réponse était : "{quoteData.correctAnswer}"</span>
            ) : (
              <span>❌ Incorrect. La bonne réponse était : "{quoteData.correctAnswer}"</span>
            )}
          </div>
        )}
      </div>
      
      <div className="buttons-container">
        {quoteData.options && quoteData.options.map((option, index) => (
          <button
            key={index}
            className={`quote-button ${
              showResult
                ? option === quoteData.correctAnswer
                  ? 'correct-answer'
                  : option === selectedAnswer
                  ? 'wrong-answer'
                  : ''
                : ''
            }`}
            onClick={() => handleChoice(option)}
            disabled={showResult}
          >
            {option}
          </button>
        ))}
      </div>

      {showResult && (
        <button className="next-button" onClick={handleNextQuote}>
          Citation suivante
        </button>
      )}
    </div>
  )
}

export default App
