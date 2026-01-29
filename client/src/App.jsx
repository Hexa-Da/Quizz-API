import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [quoteData, setQuoteData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const hasFetchedRef = useRef(false)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [wrongAnswers, setWrongAnswers] = useState(0)
  const [bestScore, setBestScore] = useState(() => {
    // Charger le meilleur score depuis localStorage au démarrage
    const saved = localStorage.getItem('bestScore')
    return saved ? parseInt(saved, 10) : 0
  })

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
    // Éviter les appels multiples causés par StrictMode
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true
      fetchQuote()
    }
  }, [])

  function handleChoice(choice) {
    if (showResult) return // Empêcher de cliquer plusieurs fois
    
    setSelectedAnswer(choice)
    setShowResult(true)
  
    // Mettre à jour le score
    if (choice === quoteData.correctAnswer) {
      setCorrectAnswers(prev => prev + 1)
    } else {
      setWrongAnswers(prev => prev + 1)
    }
  }

  function accuracyPercentage() {
    const totalAnswers = correctAnswers + wrongAnswers;
    const successRate = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
    return successRate;
  }

  function handleNextQuote() {
    fetchQuote()
  }

  useEffect(() => {
    if (correctAnswers > bestScore) {
      setBestScore(correctAnswers)
      localStorage.setItem('bestScore', correctAnswers.toString())
    }
  }, [correctAnswers, bestScore])

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
      <div className="score-container">
        <div className="score-item">
            <span>✅ Correctes: {correctAnswers}</span>
            <span>❌ Incorrectes: {wrongAnswers}</span>
        </div>
        <div className="score-item">
            <span>📊 Taux de réussite: {accuracyPercentage()}%</span>
            <span>🏆 Meilleur score: {bestScore}</span>
        </div>
      </div>
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
        {quoteData.author && (
          <div className="author-text">
            <p>{quoteData.author}</p>
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
