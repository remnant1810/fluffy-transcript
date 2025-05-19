// Transcribe.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MessageSquare } from 'lucide-react';

function Transcribe() {
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!name) {
      setError('Please enter a name for the transcript');
      return;
    }

    if (!date) {
      setError('Please enter a date');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('date', date);

    try {
      const response = await fetch('https://fluffy-transcript.onrender.com/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      navigate(`/transcripts/${data.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transcribe-container">
      <h2>Transcribe Audio</h2>
      <form onSubmit={handleSubmit} className="transcribe-form">
        <div className="form-group">
          <label htmlFor="file">Audio File:</label>
          <input
            type="file"
            id="file"
            accept="audio/*"
            onChange={handleFileChange}
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="date">Date:</label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Transcribing...' : 'Transcribe'}
        </button>
      </form>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default Transcribe;
