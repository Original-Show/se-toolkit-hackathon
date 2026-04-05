#!/bin/bash
# Run the full test suite.

set -e

echo "=== Running Tests ==="

cd backend

if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Run scripts/setup.sh first."
    exit 1
fi

source venv/bin/activate
pytest tests/ -v
