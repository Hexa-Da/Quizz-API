import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const DEFAULT_SCORE = 0;
const PERCENTAGE_MULTIPLIER = 100;
const PARSE_RADIX = 10;

function authHeaders() {
  const token = localStorage.getItem('authToken');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// --- Sous-composants ---

function LoadingScreen() {
  return (
    <div className="app">
      <div className="loading">Chargement...</div>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  return (
    <div className="app">
      <div className="login-container">
        <h1>Quizz API</h1>
        <p>Connectez-vous pour sauvegarder vos scores</p>
        <button onClick={onLogin} className="login-button">
          Se connecter avec Google
        </button>
      </div>
    </div>
  );
}

function ErrorScreen() {
  return (
    <div className="app">
      <div className="error">Erreur lors du chargement</div>
    </div>
  );
}

function UserHeader({ user, onLogout }) {
  return (
    <div className="user-header">
      <div className="user-info">
        <img src={user.photo} alt={user.name} className="user-avatar" />
        <span>{user.name}</span>
      </div>
      <button onClick={onLogout} className="logout-button">
        Déconnexion
      </button>
    </div>
  );
}

function ScoreBoard({ correctAnswers, wrongAnswers, bestScore }) {
  const totalAnswers = correctAnswers + wrongAnswers;
  const successRate = totalAnswers > 0
    ? Math.round((correctAnswers / totalAnswers) * PERCENTAGE_MULTIPLIER)
    : 0;

  return (
    <div className="score-container">
      <div className="score-item">
        <span>Correctes: {correctAnswers}</span>
        <span>Incorrectes: {wrongAnswers}</span>
      </div>
      <div className="score-item">
        <span>Taux de réussite: {successRate}%</span>
        <span>Meilleur score: {bestScore}</span>
      </div>
    </div>
  );
}

function ResultMessage({ isCorrect, correctAnswer }) {
  const className = `result-message ${isCorrect ? 'correct' : 'incorrect'}`;

  if (isCorrect) {
    return (
      <div className={className}>
        <span>Correct ! La réponse était : &quot;{correctAnswer}&quot;</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <span>Incorrect. La bonne réponse était : &quot;{correctAnswer}&quot;</span>
    </div>
  );
}

function AuthorSection({ author, celebrityImage, imageLoading }) {
  return (
    <div className="author-section">
      {imageLoading && <div className="image-loading">Chargement de l&apos;image...</div>}
      {celebrityImage && (
        <img src={celebrityImage} alt={author} className="celebrity-image" />
      )}
      <div className="author-text">
        <p>{author}</p>
      </div>
    </div>
  );
}

function QuoteDisplay({ quoteData, isQuoteLoading, showResult, isCorrect, celebrityImage, imageLoading }) {
  if (isQuoteLoading) {
    return (
      <div className="quote-box">
        <div className="loading">Chargement de la citation...</div>
      </div>
    );
  }

  return (
    <div className="quote-box">
      <p className="quote-text">{quoteData.text}</p>
      {showResult && (
        <ResultMessage isCorrect={isCorrect} correctAnswer={quoteData.correctAnswer} />
      )}
      {quoteData.author && (
        <AuthorSection
          author={quoteData.author}
          celebrityImage={celebrityImage}
          imageLoading={imageLoading}
        />
      )}
    </div>
  );
}

function AnswerButtons({ options, showResult, correctAnswer, selectedAnswer, onChoice }) {
  function getButtonClass(option) {
    if (!showResult) return '';
    if (option === correctAnswer) return 'correct-answer';
    if (option === selectedAnswer) return 'wrong-answer';
    return '';
  }

  return (
    <div className="buttons-container">
      {options.map((option, index) => (
        <button
          key={`option-${index}-${option}`}
          className={`quote-button ${getButtonClass(option)}`}
          onClick={() => onChoice(option)}
          disabled={showResult}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

// --- Composant principal ---

function App() {
  const [user, setUser] = useState(null);
  const [quoteData, setQuoteData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const hasFetchedRef = useRef(false);
  const [celebrityImage, setCelebrityImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(DEFAULT_SCORE);
  const [wrongAnswers, setWrongAnswers] = useState(DEFAULT_SCORE);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem('bestScore');
    return saved ? parseInt(saved, PARSE_RADIX) : DEFAULT_SCORE;
  });

  const fetchQuote = useCallback(() => {
    setIsQuoteLoading(true);
    setSelectedAnswer(null);
    setShowResult(false);

    fetch(`${API_URL}/api/quote`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data && data.options && Array.isArray(data.options)) {
          setQuoteData(data);
        } else {
          setQuoteData(null);
        }
        setIsQuoteLoading(false);
      })
      .catch(() => {
        setQuoteData(null);
        setIsQuoteLoading(false);
      });
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get('token');

      if (tokenFromUrl) {
        localStorage.setItem('authToken', tokenFromUrl);
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const token = localStorage.getItem('authToken');

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/user`, {
          headers: authHeaders()
        });
        const contentType = res.headers.get('content-type');
        let data = null;

        if (contentType && contentType.includes('application/json')) {
          try {
            data = await res.json();
          } catch {
            data = null;
          }
        }

        if (res.ok && data && data.id) {
          setUser(data);
          setBestScore(data.bestScore || DEFAULT_SCORE);
        } else {
          localStorage.removeItem('authToken');
        }
      } catch {
        // Token invalide ou erreur réseau
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (!hasFetchedRef.current && user) {
      hasFetchedRef.current = true;
      fetchQuote();
    }
  }, [user, fetchQuote]);

  useEffect(() => {
    if (quoteData && quoteData.author && user) {
      setImageLoading(true);
      setCelebrityImage(null);

      fetch(`${API_URL}/api/celebrity-image?name=${encodeURIComponent(quoteData.author)}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Image not found');
          }
          return res.json();
        })
        .then(data => {
          setCelebrityImage(data.image);
          setImageLoading(false);
        })
        .catch(() => {
          setCelebrityImage(null);
          setImageLoading(false);
        });
    }
  }, [quoteData, user]);

  useEffect(() => {
    if (correctAnswers > bestScore) {
      setBestScore(correctAnswers);
      localStorage.setItem('bestScore', correctAnswers.toString());
    }
  }, [correctAnswers, bestScore]);

  function handleLogin() {
    window.location.href = `${API_URL}/auth/google`;
  }

  function handleLogout() {
    fetch(`${API_URL}/auth/logout`, {
      headers: authHeaders()
    })
      .then(() => {
        localStorage.removeItem('authToken');
        setUser(null);
        setBestScore(DEFAULT_SCORE);
        setCorrectAnswers(DEFAULT_SCORE);
        setWrongAnswers(DEFAULT_SCORE);
      })
      .catch(() => {
        localStorage.removeItem('authToken');
        setUser(null);
      });
  }

  function handleChoice(choice) {
    if (showResult) return;

    setSelectedAnswer(choice);
    setShowResult(true);

    if (choice === quoteData.correctAnswer) {
      setCorrectAnswers(prev => {
        const newScore = prev + 1;
        if (user && newScore > bestScore) {
          fetch(`${API_URL}/api/score`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ score: newScore })
          })
            .then(res => res.json())
            .then(data => setBestScore(data.bestScore))
            .catch(() => {
              // Erreur réseau, le score local est déjà mis à jour
            });
        }
        return newScore;
      });
    } else {
      setWrongAnswers(prev => prev + 1);
    }
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (!quoteData || !quoteData.options) {
    return <ErrorScreen />;
  }

  const isCorrect = selectedAnswer === quoteData.correctAnswer;

  return (
    <div className="app">
      <UserHeader user={user} onLogout={handleLogout} />

      <ScoreBoard
        correctAnswers={correctAnswers}
        wrongAnswers={wrongAnswers}
        bestScore={bestScore}
      />

      <QuoteDisplay
        quoteData={quoteData}
        isQuoteLoading={isQuoteLoading}
        showResult={showResult}
        isCorrect={isCorrect}
        celebrityImage={celebrityImage}
        imageLoading={imageLoading}
      />

      <AnswerButtons
        options={quoteData.options}
        showResult={showResult}
        correctAnswer={quoteData.correctAnswer}
        selectedAnswer={selectedAnswer}
        onChoice={handleChoice}
      />

      {showResult && (
        <button className="next-button" onClick={fetchQuote}>
          Citation suivante
        </button>
      )}
    </div>
  );
}

export default App;
