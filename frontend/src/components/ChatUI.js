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

  return (
    <div className="chat-container">
      <div className="chat-header">
        <MessageSquare className="chat-icon" />
        <h2>Transcript Assistant</h2>
      </div>
      <div className="messages-container">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.isUser ? 'user' : 'bot'}`}
          >
            <div className="message-content">
              <div className="message-text">{message.text}</div>
              <div className="message-timestamp">
                {formatTimestamp(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit} className="chat-input">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Ask a question about your transcripts..."
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Thinking...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export default ChatUI;
