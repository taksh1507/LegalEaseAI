#!/bin/bash
# Render.com deployment script for LegalEaseAI Backend

echo "🚀 Starting LegalEaseAI Backend deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "✅ Backend build completed!"
echo "🌐 Backend will be available at the Render-provided URL"
echo "🔍 Health check endpoint: /health"
echo "📡 API endpoints: /api/auth/*"