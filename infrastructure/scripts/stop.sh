#!/bin/bash

echo "🛑 Stopping Cars AI Consultant..."
echo ""

docker-compose down

echo ""
echo "✅ All services stopped"
echo ""
echo "💾 Data is preserved in Docker volumes"
echo ""
echo "To remove data and volumes:"
echo "   docker-compose down -v"
echo ""
echo "To start again:"
echo "   make start"
echo ""
