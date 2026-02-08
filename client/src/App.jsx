import { useState, useEffect, useRef } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function authHeaders() {
  const token = localStorage.getItem('authToken');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

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
  const [streak, setStreak] = useState(0)
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [bestScore, setBestScore] = useState(() => {
    // Charger le meilleur score depuis localStorage au démarrage
    const saved = localStorage.getItem('bestScore')
    return saved ? parseInt(saved, 10) : 0
  })

  useEffect(() => {
    const initAuth = async () => {
      // 1. On regarde d'abord si un token vient d'arriver dans l'URL
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get('token');
      
      if (tokenFromUrl) {
        localStorage.setItem('authToken', tokenFromUrl);
        // On nettoie l'URL immédiatement
        window.history.replaceState({}, document.title, window.location.pathname);
      }
  
      // 2. Maintenant on récupère le token (soit l'ancien, soit le nouveau de l'URL)
      const token = localStorage.getItem('authToken');
  
      if (!token) {
        setIsLoading(false);
        return;
      }
  
      // 3. On vérifie l'utilisateur
      try {
        const res = await fetch(`${API_URL}/api/user`, {
          headers: authHeaders()
        });
        
        const data = await res.json();
        
        if (res.ok && data.id) {
          setUser(data);
          setBestScore(data.bestScore || 0);
          setStreak(data.streak || 0);
        } else {
          // Si le token est invalide (ex: expiré), on nettoie
          localStorage.removeItem('authToken');
        }
      } catch (error) {
        console.error("Erreur auth:", error);
      } finally {
        setIsLoading(false);
      }
    };
  
    initAuth();
  }, []);

  function handleLogin() {
    window.location.href = `${API_URL}/auth/google`
  }

  function handleLogout() {
    fetch(`${API_URL}/auth/logout`, {
      headers: authHeaders()
    })
      .then(() => {
        localStorage.removeItem('authToken')
        setUser(null)
        setBestScore(0)
        setCorrectAnswers(0)
        setWrongAnswers(0)
      })
  }

  function fetchQuote() {
    setIsQuoteLoading(true)
    setSelectedAnswer(null)
    setShowResult(false)
    
    fetch(`${API_URL}/api/quote`)
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
        setIsQuoteLoading(false)
      })
      .catch(error => {
        console.error('Erreur lors du fetch:', error)
        setQuoteData(null)
        setIsLoading(false)
      })
  }

  useEffect(() => {
    // Éviter les appels multiples causés par StrictMode
    if (!hasFetchedRef.current && user) {
      hasFetchedRef.current = true
      fetchQuote()
    }
  }, [user])


  // Récupérer l'image de la célébrité quand la citation change
  useEffect(() => {
    if (quoteData && quoteData.author && user) {
      setImageLoading(true)
      setCelebrityImage(null)
      
      fetch(`${API_URL}/api/celebrity-image?name=${encodeURIComponent(quoteData.author)}`)
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
  }, [quoteData, user])

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
          fetch(`${API_URL}/api/score`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ score: newScore })
          })
            .then(res => res.json())
            .then(data => setBestScore(data.bestScore))
        }
        return newScore
      })
      
      // Mettre à jour le streak si bonne réponse dans la journée
      fetch(`${API_URL}/api/streak`, {
        method: 'POST',
        headers: authHeaders()
      })
        .then(res => res.json())
        .then(data => {
          if (data.streak !== undefined) {
            setStreak(data.streak)
        }
      })
      .catch(err => console.error("Erreur streak:", err))

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
        <div className="score-item">
          <span>🔥 Streak : {streak} jours</span>
        </div>

      </div>

      <div className="quote-box">
        {isQuoteLoading ? (
          <div className="loading">Chargement de la citation...</div>
        ) : (
          <>
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
          </>
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
