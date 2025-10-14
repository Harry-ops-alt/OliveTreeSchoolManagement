#!/bin/bash

# Stop Development Servers Script

echo "🛑 Stopping Olive Tree School Management Servers..."

# Kill processes on ports 3000 and 3001
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null

# Clean up log files
rm -f api.log frontend.log 2>/dev/null

echo "✅ All servers stopped and logs cleaned"
