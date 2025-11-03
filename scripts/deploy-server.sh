#!/bin/bash

# Manual Deployment Script for NeDB-based Server
# Run this script directly on the server at 165.232.58.95

set -e

echo "🎨 Quill Your Dream - Server Deployment (NeDB)"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📥 Step 1: Pulling latest code from Git..."
git pull origin main
echo "✅ Code updated"
echo ""

echo "📦 Step 2: Installing dependencies..."
npm ci --production=false
echo "✅ Dependencies installed"
echo ""

echo "🏗️  Step 3: Building application..."
npm run build
echo "✅ Build complete"
echo ""

echo "📁 Step 4: Ensuring directories exist..."
mkdir -p data/nedb
mkdir -p logs
mkdir -p attached_assets
echo "✅ Directories ready"
echo ""

echo "🔄 Step 5: Restarting application with PM2..."
pm2 restart quill-your-dream || pm2 start ecosystem.config.cjs
pm2 save
echo "✅ Application restarted"
echo ""

echo "⏳ Waiting for application to start..."
sleep 3
echo ""

echo "✅ Deployment Complete!"
echo "======================================"
echo ""
echo "📊 Application Status:"
pm2 status quill-your-dream
echo ""
echo "🗄️  Database: NeDB (file-based at data/nedb/)"
echo "🌐 Application URL: http://165.232.58.95:3000"
echo ""
echo "📝 Useful commands:"
echo "   View logs:   pm2 logs quill-your-dream"
echo "   Restart app: pm2 restart quill-your-dream"
echo "   Stop app:    pm2 stop quill-your-dream"
echo ""
