// App.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Transcribe from './Transcribe';
import TranscriptsList from './TranscriptsList';
import ViewTranscript from './ViewTranscript';
import { User, MessageSquare } from 'lucide-react'; // Make sure to import these

function App() {
  const [selectedTranscriptId, setSelectedTranscriptId] = useState(null);

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/transcribe" element={<Transcribe />} />
          <Route path="/transcripts" element={
            selectedTranscriptId ? (
              <ViewTranscript transcriptId={selectedTranscriptId} onBack={() => setSelectedTranscriptId(null)} />
            ) : (
              <TranscriptsList onSelectTranscript={setSelectedTranscriptId} />
            )
          } />
          <Route path="/" element={<ChatUI />} />
        </Routes>
      </div>
    </Router>
  );

// Separate ChatUI component
function ChatUI() {
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);

  // Reference for auto-scrolling
  const messagesEndRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Helper to format timestamps
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp || Date.now());
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const input = userInput.trim();
    if (input) {
      const userMsg = { text: input, isUser: true, timestamp: Date.now() };
      setMessages(prev => [...prev, userMsg]);
      setUserInput('');
      setLoading(true);
      try {
        const response = await fetch('http://localhost:8000/search/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: input }),
        });
        const data = await response.json();
        if (response.ok && data.results && data.results.length > 0) {
          setMessages(prev => [...prev, { 
            results: data.results,            
            isUser: false,
            timestamp: Date.now()
          }]);
        } else {
          setMessages(prev => [...prev, { 
            text: data.error || 'Error: No answer received.', 
            isUser: false,
            timestamp: Date.now()
          }]);
        }
      } catch (err) {
        setMessages(prev => [...prev, { 
          text: 'Error: Could not reach Gemini API backend.', 
          isUser: false,
          timestamp: Date.now()
        }]);
        setError('Could not reach Gemini API backend.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <header>
        <div className="options-menu">
          <button
            className="options-button"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            onClick={() => setSideMenuOpen(!sideMenuOpen)}
            aria-label="Toggle options menu"
          >
            {/* Hamburger icon SVG */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
        {/* Side menu overlay */}
        <div
          className="side-menu-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: sideMenuOpen ? 0 : '-350px',
            width: '250px',
            height: '100%',
            background: '#4a2e8d',
            color: '#fff',
            transition: 'left 0.3s',
            zIndex: 1000,
            boxShadow: sideMenuOpen ? '2px 0 8px rgba(0,0,0,0.2)' : 'none',
            padding: '2rem 1rem',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <button
            onClick={() => setSideMenuOpen(false)}
            style={{ alignSelf: 'flex-end', background: 'none', border: 'none', color: '#fff', fontSize: '2rem', cursor: 'pointer' }}
            aria-label="Close side menu"
          >
            &times;
          </button>
          <h2>Options</h2>
          {/* Add your side menu items here */}
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li>
              <Link
                to="/transcribe"
                style={{ color: '#fff', textDecoration: 'none', fontSize: '1.1rem' }}
                onClick={() => setSideMenuOpen(false)}
              >
                Transcribe
              </Link>
            </li>
            <li style={{ marginTop: '1rem' }}>
              <Link
                to="/transcripts"
                style={{ color: '#fff', textDecoration: 'none', fontSize: '1.1rem' }}
                onClick={() => setSideMenuOpen(false)}
              >
                View/Edit Transcripts
              </Link>
            </li>
          </ul>
        </div>
        <div className="auth-buttons">
          <button className="login-button">Login</button>
          <button className="signup-button">Sign Up</button>
        </div>
      </header>

      <main>
        <div className="chat-container">
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="welcome-message">
                <h1>How can we help?</h1>
              </div>
            ) : (
              messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`message-wrapper ${message.isUser ? 'user-wrapper' : 'ai-wrapper'}`}>
                  
                  {/* Avatar */}
                  <div className="avatar">
                    {message.isUser ? (
                      <div className="user-avatar">
                        <User size={16} />
                      </div>
                    ) : (
                      <div className="ai-avatar">
                        <MessageSquare size={16} />
                      </div>
                    )}
                  </div>
                  
                  {/* Message content */}
                  <div className={message.isUser ? 'user-message-content' : 'ai-message-content'}>
                    {message.isUser ? (
                      // User message
                      <div className="user-message-content">
                        <p>{message.text}</p>
                        <div className="message-timestamp">{formatTime(message.timestamp)}</div>
                      </div>
                    ) : message.results ? (
                      // Message with search results
                      <div className="results-group">
                        <h3>Search results ({message.results.length})</h3>
                        {message.results.map((result, resultIndex) => (
                          <div key={resultIndex} className="result-item">
                            <div className="result-header">
                              <h4>{result.name || `Result ${resultIndex+1}`}</h4>
                              {result.score && (
                                <span className="result-score">
                                  {Math.round(result.score * 100)}%
                                </span>
                              )}
                            </div>
                            
                            {result.date && <h5>{result.date}</h5>}
                            {result.chunk_text && <p>{result.chunk_text}</p>}
                            
                            {result.filename && (
                              <div className="result-source">
                                Source: {result.filename}
                              </div>
                            )}
                          </div>
                        ))}
                        <div className="message-timestamp">{formatTime(message.timestamp)}</div>
                      </div>
                    ) : (
                      // Regular AI message
                      <div className="ai-message-content">
                        <p>{message.text}</p>
                        <div className="message-timestamp">{formatTime(message.timestamp)}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      <footer>
        <form onSubmit={handleSubmit} className="input-form">
          <input
            type="text"
            value={userInput}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="input-box"
            autoComplete="off"
          />
          <button type="submit" className="send-button" disabled={loading}>
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>   
      </footer>
    </>
  );
  }

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/transcribe" element={<Transcribe />} />
          <Route path="/transcripts" element={
            selectedTranscriptId ? (
              <ViewTranscript transcriptId={selectedTranscriptId} onBack={() => setSelectedTranscriptId(null)} />
            ) : (
              <TranscriptsList onSelectTranscript={setSelectedTranscriptId} />
            )
          } />
          <Route path="/" element={<ChatUI />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;