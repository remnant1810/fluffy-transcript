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
      <div className="welcome-message">
        <h2>Transcribe Audio</h2>
        <p>Upload your audio or video file to get started!</p>
      </div>
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label className="file-upload">
            <span>Select a file</span>
            <input 
              type="file" 
              onChange={handleFileChange} 
              accept="audio/*,video/*" 
              className="file-input"
            />
            {file && <span className="file-name">{file.name}</span>}
          </label>
        </div>
        
        <div className="form-group">
          <label>Name (optional)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter a name for this transcript"
            className="form-input"
          />
        </div>
        
        <div className="form-group">
          <label>Date (optional)</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="form-input"
          />
        </div>
        
        <div className="form-actions">
          <button 
            type="submit" 
            disabled={loading || !file}
            className={!file ? 'disabled' : ''}
          >
            {loading ? (
              <>
                <span className="spinner"></span> Uploading...
              </>
            ) : (
              'Upload and Transcribe'
            )}
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
      </form>
    </div>
  );
}

export default Transcribe;
