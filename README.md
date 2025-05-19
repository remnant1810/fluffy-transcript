# Transcript Management System

A full-stack application for managing audio transcripts with AI-powered search and Q&A capabilities.

## 🚀 Features

- Audio file upload and transcription
- AI-powered search through transcripts
- Q&A interface for interacting with transcript content
- User-friendly web interface
- RESTful API backend

## 🛠️ Tech Stack

- **Frontend**: React.js
- **Backend**: Python with FastAPI
- **Database**: SQLite (can be configured to use other databases)
- **AI**: OpenAI API for transcript processing

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

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or later)
- Python 3.8 or later
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/transcript-management-system.git
   cd transcript-management-system
   ```

2. **Backend Setup**
   ```bash
   # Create and activate a virtual environment (recommended)
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   
   # Install Python dependencies
   pip install -r backend/requirements.txt
   
   # Start the backend server
   cd backend
   uvicorn main:app --reload
   ```
   The backend will be available at `http://localhost:8000`

3. **Frontend Setup**
   ```bash
   # Navigate to the frontend directory
   cd frontend
   
   # Install Node.js dependencies
   npm install
   
   # Copy the example environment file
   cp .env.example .env
   
   # Edit the .env file with your configuration
   # (Update REACT_APP_API_URL if your backend is running on a different port)
   
   # Start the development server
   npm start
   ```
   The frontend will be available at `http://localhost:3000`

## 🌐 Deployment

### Backend Deployment

1. **Production Server**
   For production, use a production-ready server like Gunicorn with Uvicorn workers:
   ```bash
   pip install gunicorn
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
   ```

2. **Environment Variables**
   Make sure to set up proper environment variables in your production environment.

### Frontend Deployment

1. **Build for Production**
   ```bash
   cd frontend
   npm run build
   ```
   This will create a `build` directory with optimized production build.

2. **Serve with a Static Server**
   You can use serve to test the production build locally:
   ```bash
   npm install -g serve
   serve -s build
   ```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://reactjs.org/)
- [OpenAI](https://openai.com/)

## Features
- Audio file upload and transcription
- Transcript management (view, delete)
- Semantic search
- AI-powered Q&A
