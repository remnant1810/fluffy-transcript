#!/bin/bash
set -e  # Exit on error

# Print environment variables for debugging
echo "Environment variables:"
echo "PORT=$PORT"

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Run database migrations (if any)
echo "Running database migrations..."
# Add your migration commands here if needed

# Start the FastAPI server
echo "Starting server on port $PORT..."
exec uvicorn main:app --host 0.0.0.0 --port $PORT
