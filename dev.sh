#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Resume Optimizer...${NC}\n"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${BLUE}Shutting down servers...${NC}"
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start backend
echo -e "${BLUE}Starting Backend on http://localhost:8000${NC}"
cd backend && uvicorn app:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start frontend
echo -e "${BLUE}Starting Frontend on http://localhost:5173${NC}"
cd resumetx_frontend && npm run dev &
FRONTEND_PID=$!

echo -e "\n${GREEN}Both servers started!${NC}"
echo -e "Backend: http://localhost:8000"
echo -e "Frontend: http://localhost:5173"
echo -e "\nPress Ctrl+C to stop both servers\n"

# Wait for both processes
wait
