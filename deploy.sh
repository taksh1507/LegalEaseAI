#!/bin/bash

# LegalEaseAI Deployment Script for Render
# This script helps prepare your application for deployment

echo "🚀 Preparing LegalEaseAI for Render deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the root directory of your project"
    exit 1
fi

# Install dependencies
echo "📦 Installing frontend dependencies..."
npm install

echo "📦 Installing backend dependencies..."
cd backend && npm install && cd ..

# Build frontend for testing
echo "🔨 Building frontend..."
npm run build

# Test backend startup
echo "🧪 Testing backend startup..."
cd backend
if node -e "require('./index.js')" 2>/dev/null; then
    echo "✅ Backend startup test passed"
else
    echo "⚠️  Backend startup test failed - check your configuration"
fi
cd ..

echo ""
echo "✅ Pre-deployment checks complete!"
echo ""
echo "📋 Next steps for Render deployment:"
echo "1. Push your code to GitHub"
echo "2. Connect your GitHub repository to Render"
echo "3. Set up environment variables in Render dashboard:"
echo "   - SMTP_USER (your email)"
echo "   - SMTP_PASS (your app password)"
echo "   - OPENAI_ROUTER_KEY (your OpenAI API key)"
echo "4. Deploy using the render.yaml configuration"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"