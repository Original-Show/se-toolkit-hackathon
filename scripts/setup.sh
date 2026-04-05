#!/bin/bash
# Setup script for local development environment.

set -e

echo "=== Recipe Manager - Setup Script ==="

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not installed."
    exit 1
fi

# Create virtual environment
echo "Creating virtual environment..."
cd backend
python3 -m venv venv
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Copy env file if not exists
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
fi

echo ""
echo "Setup complete!"
echo ""
echo "To start the backend server:"
echo "  cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo ""
echo "To start the frontend, open frontend/index.html in your browser or run:"
echo "  python3 -m http.server 3000 --directory frontend"
echo ""
echo "Or use Docker:"
echo "  docker compose up --build"
