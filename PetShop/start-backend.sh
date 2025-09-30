#!/bin/bash

echo "🐾 Starting Pet Shop Backend..."
echo "==============================="

cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Start the backend
echo "Starting backend server..."
python app.py
