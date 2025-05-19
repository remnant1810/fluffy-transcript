#!/bin/bash

# Install dependencies
pip install -r requirements.txt

# Run database migrations (if any)
# Add your migration commands here if needed

# Start the FastAPI server
exec uvicorn main:app --host 0.0.0.0 --port $PORT --reload
