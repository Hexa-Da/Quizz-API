import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [quoteData, setQuoteData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const hasFetchedRef = useRef(false)
  const [celebrityImage, setCelebrityImage] = useState(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [wrongAnswers, setWrongAnswers] = useState(0)
  const [bestScore, setBestScore] = useState(() => {
    // Charger le meilleur score depuis localStorage au démarrage
    const saved = localStorage.getItem('bestScore')
    return saved ? parseInt(saved, 10) : 0
  })

  // Vérifier l'authentification au chargement
  useEffect(() => {
    fetch('http://localhost:3000/api/user', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setUser(data)
          setBestScore(data.bestScore || 0)
        }
        setIsLoading(false)
      })
      .catch(() => {
        setIsLoading(false)
      })
  }, [])

  function handleLogin() {
    window.location.href = 'http://localhost:3000/auth/google'
  }

  function handleLogout() {
    fetch('http://localhost:3000/auth/logout', {
      credentials: 'include'
    })
      .then(() => {
        setUser(null)
        setBestScore(0)
        setCorrectAnswers(0)
        setWrongAnswers(0)
      })
  }

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


  // Récupérer l'image de la célébrité quand la citation change
  useEffect(() => {
    if (quoteData && quoteData.author) {
      setImageLoading(true)
      setCelebrityImage(null)
      
      fetch(`http://localhost:3000/api/celebrity-image?name=${encodeURIComponent(quoteData.author)}`)
        .then(res => {
          if (!res.ok) throw new Error('Image not found')
          return res.json()
        })
        .then(data => {
          setCelebrityImage(data.image)
          setImageLoading(false)
        })
        .catch(error => {
          console.warn(`Pas d'image trouvée pour ${quoteData.author}:`, error)
          setImageLoading(false)
        })
    }
  }, [quoteData])

  function handleChoice(choice) {
    if (showResult) return // Empêcher de cliquer plusieurs fois
    
    setSelectedAnswer(choice)
    setShowResult(true)
  
    // Mettre à jour le score
    if (choice === quoteData.correctAnswer) {
      setCorrectAnswers(prev => {
        const newScore = prev + 1
        // Sauvegarder le score si l'utilisateur est connecté
        if (user && newScore > bestScore) {
          fetch('http://localhost:3000/api/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ score: newScore })
          })
            .then(res => res.json())
            .then(data => setBestScore(data.bestScore))
        }
        return newScore
      })
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

  if (!user) {
    return (
      <div className="app">
        <div className="login-container">
          <h1>Quizz API</h1>
          <p>Connectez-vous pour sauvegarder vos scores</p>
          <button onClick={handleLogin} className="login-button">
            Se connecter avec Google
          </button>
        </div>
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
      <div className="user-header">
        <div className="user-info">
          <img src={user.photo} alt={user.name} className="user-avatar" />
          <span>{user.name}</span>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Déconnexion
        </button>
      </div>

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

            <div className="author-section">
              {imageLoading && <div className="image-loading">Chargement de l'image...</div>}
              {celebrityImage && (
                <img src={celebrityImage} alt={quoteData.author} className="celebrity-image" />
              )}
            <div className="author-text">
              <p>{quoteData.author}</p>
            </div>
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
