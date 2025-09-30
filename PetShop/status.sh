#!/bin/bash

echo "🐾 Pet Shop Development Environment Status"
echo "=========================================="

# Check database
echo "📊 Database Status:"
if docker-compose -f docker-compose.db.yml ps | grep -q "Up"; then
    echo "  ✅ Database: Running (Docker)"
    echo "  📍 URL: http://localhost:8080"
else
    echo "  ❌ Database: Not running"
fi

# Check backend
echo ""
echo "🔧 Backend Status:"
if ps aux | grep -q "[p]ython app.py"; then
    echo "  ✅ Backend: Running (Local)"
    echo "  📍 URL: http://localhost:5000"
else
    echo "  ❌ Backend: Not running"
fi

# Check frontend
echo ""
echo "🎨 Frontend Status:"
if ps aux | grep -q "[n]pm run dev"; then
    echo "  ✅ Frontend: Running (Local)"
    echo "  📍 URL: http://localhost:5173"
else
    echo "  ❌ Frontend: Not running"
fi

echo ""
echo "🚀 Quick Start Commands:"
echo "  Database: ./start-db.sh"
echo "  Backend:  ./start-backend.sh"
echo "  Frontend: ./start-frontend.sh"
