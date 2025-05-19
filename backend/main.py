from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone
from typing import List, Dict, Any, Optional
import whisper
import os
import re
import logging
from pydantic_settings import BaseSettings
from contextlib import contextmanager
import openai

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration using Pydantic for type safety and validation
class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./transcripts.db"
    WHISPER_MODEL: str = "tiny"
    EMBEDDING_MODEL: str = "all-mpnet-base-v2"
    PINECONE_API_KEY: str
    PINECONE_INDEX: str = "transcripts"
    PINECONE_REGION: str = "us-west-2"
    PINECONE_CLOUD: str = "aws"
    EMBEDDING_DIMENSION: int = 768
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-3.5-turbo"
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50
    
    class Config:
        env_file = "../frontend/.env"

# Load settings
settings = Settings()

# Database setup
engine = create_engine(
    settings.DATABASE_URL, 
    connect_args={"check_same_thread": False}
)
Base = declarative_base()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# Context manager for database sessions
@contextmanager
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Database model
class Transcript(Base):
    __tablename__ = "transcripts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    date = Column(String, index=True)
    filename = Column(String, unique=True, index=True)
    text = Column(Text)

# Create tables
Base.metadata.create_all(bind=engine)

# Initialize Pinecone client
pc = Pinecone(api_key=settings.PINECONE_API_KEY)

# Initialize embedding model
embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)

# Initialize OpenAI client
openai.api_key = settings.OPENAI_API_KEY

# Initialize Whisper model (lazy loading)
_whisper_model = None
def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        _whisper_model = whisper.load_model(settings.WHISPER_MODEL)
    return _whisper_model

# Text processing utilities
def chunk_transcript(text: str, chunk_size: int = settings.CHUNK_SIZE, 
                    overlap: int = settings.CHUNK_OVERLAP) -> List[str]:
    """Split transcript into overlapping chunks for better semantic search."""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks = []
    current_chunk = []
    current_size = 0
    
    for sentence in sentences:
        sentence_words = len(sentence.split())
        
        if current_size + sentence_words > chunk_size and current_size > 0:
            chunks.append(' '.join(current_chunk))
            overlap_sentences = current_chunk[-3:] if len(current_chunk) > 3 else current_chunk
            current_chunk = overlap_sentences
            current_size = sum(len(s.split()) for s in overlap_sentences)
        
        current_chunk.append(sentence)
        current_size += sentence_words
    
    if current_chunk:
        chunks.append(' '.join(current_chunk))
    
    return chunks

# Pinecone index initialization
def init_pinecone():
    """Initialize Pinecone index if it doesn't exist."""
    if settings.PINECONE_INDEX not in pc.list_indexes().names():
        logger.info(f"Creating Pinecone index: {settings.PINECONE_INDEX}")
        pc.create_index(
            name=settings.PINECONE_INDEX,
            dimension=settings.EMBEDDING_DIMENSION,
            metric='cosine',
            spec={"serverless": {"cloud": settings.PINECONE_CLOUD, "region": settings.PINECONE_REGION}}
        )
    return pc.Index(settings.PINECONE_INDEX)

# Create Pinecone index
index = init_pinecone()

# Initialize FastAPI app
app = FastAPI(title="Transcript Processing API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Endpoints
@app.post("/transcribe/")
async def transcribe_audio(
    file: UploadFile = File(...), 
    name: str = Form(...), 
    date: str = Form(...)
):
    """
    Upload audio file and transcribe it using Whisper.
    The transcript is stored in SQLite and indexed in Pinecone.
    """
    try:
        # Use the date string as the filename
        filename = date
        
        # Check for duplicate transcript
        with get_db() as db:
            existing = db.query(Transcript).filter(Transcript.filename == filename).first()
            if existing:
                return {
                    "id": existing.id, 
                    "name": existing.name, 
                    "date": existing.date, 
                    "text": existing.text, 
                    "detail": "Transcript for this date already exists."
                }
            
        # Process audio file
        contents = await file.read()
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as f:
            f.write(contents)
            
        # Transcribe with Whisper
        whisper_model = get_whisper_model()
        result = whisper_model.transcribe(temp_path)
        os.remove(temp_path)
        text = result["text"]
        
        # Save to SQLite
        with get_db() as db:
            transcript = Transcript(name=name, date=date, filename=filename, text=text)
            db.add(transcript)
            db.commit()
            db.refresh(transcript)
            transcript_id = transcript.id
        
        # Split text into chunks and create embeddings
        chunks = chunk_transcript(text)
        
        # Create vector records
        vectors = []
        for i, chunk in enumerate(chunks):
            # Generate embedding
            embedding = embedding_model.encode(chunk).tolist()
            
            # Create vector record
            vectors.append({
                "id": f"{transcript_id}_{i}",
                "values": embedding,
                "metadata": {
                    "transcript_id": transcript_id,
                    "chunk_index": i,
                    "text": chunk,
                    "date": date,
                    "name": name
                }
            })
        
        # Upsert vectors to Pinecone (in batches)
        embedding_status = "success"
        batch_size = 100
        try:
            for i in range(0, len(vectors), batch_size):
                batch = vectors[i:i+batch_size]
                index.upsert(vectors=batch)
        except Exception as e:
            logger.error(f"Pinecone upsert error: {e}")
            embedding_status = f"embedding_failed: {str(e)}"
        
        return {
            "id": transcript_id, 
            "name": name, 
            "date": date, 
            "text": text, 
            "embedding_status": embedding_status,
            "chunks_processed": len(chunks)
        }
        
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search/")
async def semantic_search(request: Request):
    """
    Semantic search endpoint. Expects JSON body: {"query": "your question here"}
    Returns top 5 most relevant transcript chunks with metadata and full transcript text.
    """
    try:
        data = await request.json()
        query = data.get("query")
        if not query:
            raise HTTPException(status_code=400, detail="Missing 'query' in request body")
        
        # Embed the query
        query_embedding = embedding_model.encode(query).tolist()
        
        # Query Pinecone
        try:
            results = index.query(
                vector=query_embedding, 
                top_k=5, 
                include_metadata=True
            )
        except Exception as e:
            logger.error(f"Pinecone query error: {e}")
            raise HTTPException(status_code=500, detail=f"Pinecone query failed: {str(e)}")
        
        # Fetch full transcript text from SQLite for each match
        matches = []
        with get_db() as db:
            for match in results.get('matches', []):
                transcript_id = match['metadata'].get('transcript_id')
                chunk_index = match['metadata'].get('chunk_index')
                text_chunk = match['metadata'].get('text')
                transcript = db.query(Transcript).filter(Transcript.id == transcript_id).first()
                matches.append({
                    "score": match.get('score'),
                    "transcript_id": transcript_id,
                    "chunk_index": chunk_index,
                    "chunk_text": text_chunk,
                    "name": match['metadata'].get('name'),
                    "date": match['metadata'].get('date'),
                    "full_transcript": transcript.text if transcript else None,
                    "filename": transcript.filename if transcript else None
                })
        
        return {"results": matches}
    
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask/")
async def ask_question(request: Request):
    """
    Retrieval-augmented Q&A endpoint. Expects JSON body: {"question": "your question here"}
    Returns an LLM-generated answer based on the most relevant transcript chunks.
    """
    try:
        data = await request.json()
        question = data.get("question")
        if not question:
            raise HTTPException(status_code=400, detail="Missing 'question' in request body")
        
        # Step 1: Semantic search for relevant chunks
        query_embedding = embedding_model.encode(question).tolist()
        try:
            results = index.query(
                vector=query_embedding, 
                top_k=5, 
                include_metadata=True
            )
        except Exception as e:
            logger.error(f"Pinecone query error in ask: {e}")
            raise HTTPException(status_code=500, detail=f"Pinecone query failed: {str(e)}")
        
        # Step 2: Build context string
        context = ""
        sources = []
        
        # Build a more detailed sources list
        with get_db() as db:
            for match in results.get('matches', []):
                text = match['metadata'].get('text', '')
                context += text + "\n\n"
                
                transcript_id = match['metadata'].get('transcript_id')
                date = match['metadata'].get('date')
                name = match['metadata'].get('name')
                
                transcript = db.query(Transcript).filter(Transcript.id == transcript_id).first()
                
                sources.append({
                    "id": transcript_id,
                    "name": name or (transcript.name if transcript else "Unknown"),
                    "date": date or (transcript.date if transcript else "Unknown"),
                    "score": match.get('score')
                })
        
        # Step 3: Compose prompt for LLM
        prompt = f"""Answer the following question based only on the provided context.
        
        Context:
        {context}
        
        Question: {question}
        
        Answer:"""
        
        # Step 4: Call OpenAI API
        try:
            response = openai.ChatCompletion.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}]
            )
            answer = response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"OpenAI API call failed: {e}")
            raise HTTPException(status_code=500, detail=f"OpenAI API call failed: {str(e)}")
        
        return {"answer": answer, "sources": sources}
    
    except Exception as e:
        logger.error(f"Ask question error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/transcript/{transcript_id}")
def get_transcript(transcript_id: int):
    """Retrieve a single transcript by ID."""
    try:
        with get_db() as db:
            transcript = db.query(Transcript).filter(Transcript.id == transcript_id).first()
            if not transcript:
                raise HTTPException(status_code=404, detail="Transcript not found")
            
            return {
                "id": transcript.id, 
                "name": transcript.name, 
                "date": transcript.date, 
                "filename": transcript.filename, 
                "text": transcript.text
            }
    except Exception as e:
        logger.error(f"Get transcript error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/transcripts/")
def list_transcripts():
    """List all transcripts."""
    try:
        with get_db() as db:
            transcripts = db.query(Transcript).all()
            return [
                {
                    "id": t.id, 
                    "name": t.name, 
                    "date": t.date, 
                    "filename": t.filename, 
                    "text": t.text
                }
                for t in transcripts
            ]
    except Exception as e:
        logger.error(f"List transcripts error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/transcript/{transcript_id}")
async def update_transcript(transcript_id: int, request: Request):
    """Update transcript text and re-index in Pinecone."""
    try:
        data = await request.json()
        text = data.get("text")
        if not text:
            raise HTTPException(status_code=400, detail="Missing 'text' in request body")
        
        with get_db() as db:
            transcript = db.query(Transcript).filter(Transcript.id == transcript_id).first()
            if not transcript:
                raise HTTPException(status_code=404, detail="Transcript not found")
            
            # Update the text
            transcript.text = text
            db.commit()
            db.refresh(transcript)
            
            # Re-index in Pinecone
            try:
                # First delete all existing chunks
                ids_to_delete = [f"{transcript_id}_{i}" for i in range(1000)]  # Assuming max 1000 chunks
                index.delete(ids=ids_to_delete)
                
                # Now create new chunks and vectors
                chunks = chunk_transcript(text)
                vectors = []
                
                for i, chunk in enumerate(chunks):
                    embedding = embedding_model.encode(chunk).tolist()
                    vectors.append({
                        "id": f"{transcript_id}_{i}",
                        "values": embedding,
                        "metadata": {
                            "transcript_id": transcript_id,
                            "chunk_index": i,
                            "text": chunk,
                            "date": transcript.date,
                            "name": transcript.name
                        }
                    })
                
                # Upsert in batches
                batch_size = 100
                for i in range(0, len(vectors), batch_size):
                    batch = vectors[i:i+batch_size]
                    index.upsert(vectors=batch)
                
                embedding_status = "success"
                
            except Exception as e:
                logger.error(f"Re-indexing error: {e}")
                embedding_status = f"embedding_failed: {str(e)}"
            
            return {
                "id": transcript.id, 
                "name": transcript.name,
                "date": transcript.date,
                "filename": transcript.filename, 
                "text": transcript.text,
                "embedding_status": embedding_status,
                "chunks_processed": len(chunks) if 'chunks' in locals() else 0
            }
    
    except Exception as e:
        logger.error(f"Update transcript error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/transcript/{transcript_id}")
def delete_transcript(transcript_id: int):
    """Delete a transcript and its embeddings."""
    try:
        with get_db() as db:
            transcript = db.query(Transcript).filter(Transcript.id == transcript_id).first()
            if not transcript:
                raise HTTPException(status_code=404, detail="Transcript not found")
            
            # Delete from SQLite
            db.delete(transcript)
            db.commit()
            
            # Delete from Pinecone
            try:
                # Delete all chunks for this transcript
                ids_to_delete = [f"{transcript_id}_{i}" for i in range(1000)]  # Assuming max 1000 chunks
                index.delete(ids=ids_to_delete)
                deletion_status = "success"
            except Exception as e:
                logger.error(f"Pinecone deletion error: {e}")
                deletion_status = f"vector_deletion_failed: {str(e)}"
            
            return {
                "detail": "Transcript deleted", 
                "vector_deletion_status": deletion_status
            }
    
    except Exception as e:
        logger.error(f"Delete transcript error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
