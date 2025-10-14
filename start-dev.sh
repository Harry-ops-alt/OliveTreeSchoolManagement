#!/bin/bash

# Development Server Startup Script
# This script starts both API and Frontend servers

echo "🚀 Starting Olive Tree School Management Development Servers"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Kill any existing processes on ports 3000 and 3001
echo "🧹 Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
sleep 2

echo -e "${GREEN}✅ Ports cleared${NC}"
echo ""

# Start API in background
echo "🔧 Starting API server (port 3001)..."
cd "$(dirname "$0")"
pnpm --filter api start:dev > api.log 2>&1 &
API_PID=$!
echo -e "${YELLOW}API PID: $API_PID${NC}"

# Wait for API to be ready
echo "⏳ Waiting for API to start..."
for i in {1..30}; do
    if curl -s http://localhost:3001/healthz > /dev/null 2>&1; then
        echo -e "${GREEN}✅ API is ready on http://localhost:3001${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ API failed to start. Check api.log for errors${NC}"
        exit 1
    fi
    sleep 1
done
echo ""

# Start Frontend in background
echo "🎨 Starting Frontend server (port 3000)..."
pnpm --filter next dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${YELLOW}Frontend PID: $FRONTEND_PID${NC}"

# Wait for Frontend to be ready
echo "⏳ Waiting for Frontend to start..."
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is ready on http://localhost:3000${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Frontend failed to start. Check frontend.log for errors${NC}"
        exit 1
    fi
    sleep 1
done
echo ""

# Success message
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Both servers are running!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 URLs:"
echo "  - Frontend: http://localhost:3000"
echo "  - API:      http://localhost:3001"
echo "  - API Docs: http://localhost:3001/api"
echo ""
echo "👤 Test Login:"
echo "  - Email:    finance.manager@olive.school"
echo "  - Password: Password123!"
echo ""
echo "📝 Logs:"
echo "  - API:      tail -f api.log"
echo "  - Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop servers:"
echo "  - kill $API_PID $FRONTEND_PID"
echo "  - Or press Ctrl+C and run: ./stop-dev.sh"
echo ""
echo "Press Ctrl+C to stop all servers..."

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Stopping servers...'; kill $API_PID $FRONTEND_PID 2>/dev/null; echo '✅ Servers stopped'; exit 0" INT

# Keep script running
wait
