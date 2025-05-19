# Transcript Management System

A full-stack application for managing audio transcripts with AI-powered search and Q&A capabilities.

## Project Structure

```
Transcript/
├── backend/                # Python backend
│   ├── main.py            # FastAPI application
│   └── requirements.txt   # Python dependencies
├── frontend/              # React frontend
│   ├── public/           # Static assets
│   ├── src/              # Source code
│   │   ├── components/   # React components
│   │   │   ├── Transcribe.js
│   │   │   ├── ViewTranscript.js
│   │   │   ├── TranscriptsList.js
│   │   │   └── ChatUI.js
│   │   ├── App.js        # Main React component
│   │   ├── index.js      # React entry point
│   │   └── App.css       # Global styles
│   ├── package.json      # Node.js dependencies
│   └── .env              # Environment variables
└── README.md            # Project documentation
```

## Setup

### Backend
1. Install Python dependencies:
```bash
pip install -r backend/requirements.txt
```

2. Start the backend server:
```bash
python backend/main.py
```

### Frontend
1. Install Node.js dependencies:
```bash
cd frontend
npm install
```

2. Start the frontend development server:
```bash
npm start
```

## Features
- Audio file upload and transcription
- Transcript management (view, delete)
- Semantic search
- AI-powered Q&A
