// ChatUI.js
import React, { useState, useRef } from 'react';
import { MessageSquare } from 'lucide-react';

function ChatUI() {
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const newMessage = {
      text: userInput,
      timestamp: new Date().toISOString(),
      isUser: true
    };

    setMessages([...messages, newMessage]);
    setUserInput('');
    setLoading(true);

    try {
      const response = await fetch('https://fluffy-transcript.onrender.com/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: userInput }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const botResponse = {
        text: data.answer,
        timestamp: new Date().toISOString(),
        isUser: false
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }

    scrollToBottom();
  };

  // Auto-scroll to bottom when messages change or loading state changes
  React.useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle virtual keyboard on mobile
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  return (
    <div className="chat-container">
      <div className="chat-header">
        <MessageSquare className="chat-icon" size={isMobile ? 20 : 24} />
        <h2>Transcript Assistant</h2>
      </div>
      
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <h3>Welcome to Transcript Assistant</h3>
            <p>Ask me anything about your transcripts!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.isUser ? 'user' : 'bot'}`}
            >
              <div className="message-content">
                <div className="message-text">
                  {message.text.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </div>
                <div className="message-timestamp">
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-container">
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} className="chat-input">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask about your transcripts..."
            disabled={loading}
            autoFocus={!isMobile} // Don't auto-focus on mobile to prevent keyboard popup
            enterKeyHint="send"
            inputMode="text"
            aria-label="Type your message"
          />
          <button 
            type="submit" 
            disabled={loading || !userInput.trim()}
            className={loading ? 'loading' : ''}
            aria-label={loading ? 'Sending...' : 'Send message'}
          >
            {loading ? (
              <>
                <span className="spinner" aria-hidden="true"></span>
                <span>Thinking...</span>
              </>
            ) : (
              <span>Send</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatUI;
