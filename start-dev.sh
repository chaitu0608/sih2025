#!/bin/bash

# Lethe Development Server Script
# This script starts both frontend dev server and backend server for development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="/Users/chaitu0608/Desktop/Trial3/sih2025"
LETHE_BINARY="$PROJECT_ROOT/lethe/target/release/lethe"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_PORT=3001
FRONTEND_PORT=3000

echo -e "${BLUE}🚀 Starting Lethe Development Environment${NC}"
echo "=================================================="

# Check if lethe binary exists
if [ ! -f "$LETHE_BINARY" ]; then
    echo -e "${RED}❌ Lethe binary not found at: $LETHE_BINARY${NC}"
    echo -e "${YELLOW}Building lethe binary...${NC}"
    cd "$PROJECT_ROOT/lethe"
    cargo build --release
    if [ ! -f "$LETHE_BINARY" ]; then
        echo -e "${RED}❌ Failed to build lethe binary${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Lethe binary built successfully${NC}"
fi

# Set environment variables
export LETHE_BIN="$LETHE_BINARY"
export PORT=$BACKEND_PORT

# Check if ports are available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${RED}❌ Port $port is already in use${NC}"
        echo -e "${YELLOW}Killing processes on port $port...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

check_port $BACKEND_PORT
check_port $FRONTEND_PORT

cd "$FRONTEND_DIR"

echo -e "${BLUE}🌐 Starting backend server on port $BACKEND_PORT...${NC}"
node server/index.js &
BACKEND_PID=$!

echo -e "${BLUE}🌐 Starting frontend dev server on port $FRONTEND_PORT...${NC}"
npm run dev &
FRONTEND_PID=$!

# Wait for servers to start
sleep 5

echo ""
echo -e "${GREEN}🎉 Development environment is running!${NC}"
echo "=================================================="
echo -e "${BLUE}📱 Frontend Dev Server:${NC} http://localhost:$FRONTEND_PORT"
echo -e "${BLUE}🔧 Backend API:${NC} http://localhost:$BACKEND_PORT/api"
echo -e "${BLUE}📡 WebSocket:${NC} ws://localhost:$BACKEND_PORT/ws"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo "• Frontend will auto-reload on changes"
echo "• Backend will need manual restart for changes"
echo "• Make sure you have appropriate permissions for device access"
echo ""
echo -e "${BLUE}Press Ctrl+C to stop both servers${NC}"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping development servers...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}✅ Servers stopped${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for processes
wait
