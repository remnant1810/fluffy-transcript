// ViewTranscript.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

function ViewTranscript({ transcriptId, onBack }) {
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTranscript();
  }, [transcriptId]);

  const fetchTranscript = async () => {
    try {
      const response = await fetch(`https://fluffy-transcript.onrender.com/transcripts/${transcriptId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transcript');
      }
      const data = await response.json();
      setTranscript(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    onBack();
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this transcript?')) {
      return;
    }

    try {
      const response = await fetch(`https://fluffy-transcript.onrender.com/transcripts/${transcriptId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete transcript');
      }

      navigate('/transcripts');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div>Loading transcript...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="transcript-view">
      <div className="transcript-header">
        <h2>{transcript.name}</h2>
        <div className="transcript-meta">
          <span>Date: {transcript.date}</span>
          <button onClick={handleBack}>Back</button>
          <button onClick={handleDelete} className="delete-btn">Delete</button>
        </div>
      </div>
      <div className="transcript-content">
        <pre>{transcript.text}</pre>
      </div>
    </div>
  );
}

export default ViewTranscript;
