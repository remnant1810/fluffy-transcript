import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Transcribe from './components/Transcribe';
import TranscriptsList from './components/TranscriptsList';
import ViewTranscript from './components/ViewTranscript';
import ChatUI from './components/ChatUI';
import { User, MessageSquare } from 'lucide-react';

function App() {
  const [selectedTranscriptId, setSelectedTranscriptId] = useState(null);

  return (
    <Router>
      <div className="app">
        <nav className="main-nav">
          <Link to="/" className="nav-item">
            <MessageSquare className="nav-icon" />
            <span>Chat</span>
          </Link>
          <Link to="/transcribe" className="nav-item">
            <User className="nav-icon" />
            <span>Transcribe</span>
          </Link>
          <Link to="/transcripts" className="nav-item">
            <span>Transcripts</span>
          </Link>
        </nav>

        <main className="main-content">
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
        </main>
      </div>
    </Router>
  );
}

export default App;
