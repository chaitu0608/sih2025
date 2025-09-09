#!/bin/bash

# Lethe Complete Deployment Script
# This script starts both the Rust backend and Node.js frontend server

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

echo -e "${BLUE}🚀 Starting Lethe Secure Drive Wiping Utility${NC}"
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

# Test lethe binary
echo -e "${BLUE}🔍 Testing lethe binary...${NC}"
if ! "$LETHE_BINARY" --version > /dev/null 2>&1; then
    echo -e "${RED}❌ Lethe binary is not working properly${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Lethe binary is working${NC}"

# Check if frontend is built
if [ ! -d "$FRONTEND_DIR/dist" ]; then
    echo -e "${YELLOW}📦 Building frontend...${NC}"
    cd "$FRONTEND_DIR"
    npm install
    npm run build
    echo -e "${GREEN}✅ Frontend built successfully${NC}"
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

echo -e "${BLUE}🌐 Starting backend server on port $BACKEND_PORT...${NC}"
cd "$FRONTEND_DIR"

# Start the backend server
node server/index.js &
BACKEND_PID=$!

# Wait a moment for the server to start
sleep 3

# Check if backend is running
if ! curl -s http://localhost:$BACKEND_PORT/api/system/check > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend server failed to start${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo -e "${GREEN}✅ Backend server started successfully (PID: $BACKEND_PID)${NC}"
echo -e "${BLUE}🌐 Backend API available at: http://localhost:$BACKEND_PORT${NC}"
echo -e "${BLUE}🌐 WebSocket available at: ws://localhost:$BACKEND_PORT/ws${NC}"

echo ""
echo -e "${GREEN}🎉 Lethe is now running!${NC}"
echo "=================================================="
echo -e "${BLUE}📱 Web Interface:${NC} http://localhost:$BACKEND_PORT"
echo -e "${BLUE}🔧 API Endpoint:${NC} http://localhost:$BACKEND_PORT/api"
echo -e "${BLUE}📡 WebSocket:${NC} ws://localhost:$BACKEND_PORT/ws"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo "• Make sure you have appropriate permissions to access storage devices"
echo "• On Linux/macOS, you may need to run with sudo for device access"
echo "• This tool permanently destroys data - use with extreme caution"
echo ""
echo -e "${BLUE}Press Ctrl+C to stop the server${NC}"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping Lethe server...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    echo -e "${GREEN}✅ Server stopped${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for the backend process
wait $BACKEND_PID
