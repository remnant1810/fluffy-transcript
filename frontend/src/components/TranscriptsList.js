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
      const response = await fetch('http://localhost:8000/transcripts');
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
    return <div>Loading transcripts...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="transcripts-list">
      <h2>Transcripts</h2>
      {transcripts.length === 0 ? (
        <div>No transcripts available</div>
      ) : (
        <div className="transcripts-grid">
          {transcripts.map((transcript) => (
            <div
              key={transcript.id}
              className="transcript-card"
              onClick={() => handleSelect(transcript.id)}
            >
              <MessageSquare className="transcript-icon" />
              <h3>{transcript.name}</h3>
              <div className="transcript-meta">
                <span>Date: {transcript.date}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TranscriptsList;
