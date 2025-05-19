// TranscriptsList.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

function TranscriptsList({ onSelectTranscript }) {
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTranscripts();
  }, []);

  const fetchTranscripts = async () => {
    try {
      const response = await fetch('https://fluffy-transcript.onrender.com/transcripts');
      if (!response.ok) {
        throw new Error('Failed to fetch transcripts');
      }
      const data = await response.json();
      setTranscripts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (transcriptId) => {
    onSelectTranscript(transcriptId);
  };

  if (loading) {
    return <div className="loading">Loading transcripts...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="transcripts-list">
      <h2>Transcripts</h2>
      {transcripts.length === 0 ? (
        <div className="no-transcripts">No transcripts available. Upload a new one to get started.</div>
      ) : (
        <div className="transcripts-grid">
          {transcripts.map((transcript) => (
            <div
              key={transcript.id}
              className="transcript-card"
              onClick={() => handleSelect(transcript.id)}
            >
              <h3>{transcript.name || 'Untitled Transcript'}</h3>
              <div className="transcript-meta">
                <span>📅 {new Date(transcript.date).toLocaleDateString()}</span>
                {transcript.duration && <span>⏱️ {Math.round(transcript.duration / 60)} min</span>}
              </div>
              <p className="transcript-preview">
                {transcript.content ? `${transcript.content.substring(0, 150)}${transcript.content.length > 150 ? '...' : ''}` : 'No content available'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TranscriptsList;
