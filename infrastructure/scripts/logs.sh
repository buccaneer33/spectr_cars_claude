#!/bin/bash

SERVICE=${1:-}

if [ -z "$SERVICE" ]; then
    echo "📋 Showing logs for all services..."
    echo "   Press Ctrl+C to exit"
    echo ""
    docker-compose logs -f --tail=100
else
    echo "📋 Showing logs for: $SERVICE"
    echo "   Press Ctrl+C to exit"
    echo ""
    docker-compose logs -f --tail=100 $SERVICE
fi
