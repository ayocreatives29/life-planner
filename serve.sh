#!/bin/bash

# Basic local server for development
# Requires Node.js to be installed

PORT=${1:-3000}

echo "Starting life planner server on port $PORT..."
echo "Open http://localhost:$PORT in your browser"
echo "Press Ctrl+C to stop"

if command -v npx &> /dev/null; then
    npx serve . -p $PORT
elif command -v python3 &> /dev/null; then
    python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer $PORT
else
    echo "No suitable server found. Please install Node.js or Python."
    exit 1
fi
