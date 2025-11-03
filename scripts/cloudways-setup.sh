#!/bin/bash

# Cloudways Setup Script for Quill Your Dream
# This script helps set up the application on a Cloudways server

set -e  # Exit on error

echo "🎨 Quill Your Dream - Cloudways Setup"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "⚠️  Warning: Node.js version $NODE_VERSION detected. Version 20+ recommended."
fi

echo "📦 Step 1: Installing dependencies..."
npm install --production
echo "✅ Dependencies installed"
echo ""

echo "🔨 Step 2: Building application..."
npm run build
echo "✅ Build complete"
echo ""

echo "📁 Step 3: Creating directories..."
mkdir -p logs
mkdir -p attached_assets/optimized
mkdir -p tmp
echo "✅ Directories created"
echo ""

echo "🔑 Step 4: Environment Variables"
echo "--------------------------------"
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file with your actual credentials:"
    echo "   - Database credentials (DATABASE_URL, PGHOST, etc.)"
    echo "   - SESSION_SECRET (generate with: openssl rand -base64 32)"
    echo "   - ADMIN_EMAILS (your admin email address)"
    echo "   - Domain (REPLIT_DOMAINS)"
    echo ""
    read -p "Press Enter to edit .env now, or Ctrl+C to exit and edit manually..."
    ${EDITOR:-nano} .env
else
    echo "✅ .env file exists"
fi
echo ""

echo "🗄️  Step 5: Database Setup"
echo "-------------------------"
read -p "Have you set up PostgreSQL and updated .env with credentials? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Pushing database schema..."
    npm run db:push || {
        echo "⚠️  Database push failed. Trying force push..."
        npm run db:push -- --force
    }
    echo "✅ Database schema initialized"
    echo ""
    
    # Ask about data migration
    if [ -f "server/migrate-data.ts" ]; then
        read -p "Do you want to migrate data from JSON files? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            npx tsx server/migrate-data.ts
            echo "✅ Data migrated"
        fi
    fi
else
    echo "⚠️  Skipping database setup. Run 'npm run db:push' manually after configuring."
fi
echo ""

echo "🚀 Step 6: PM2 Setup"
echo "-------------------"
if ! command -v pm2 &> /dev/null; then
    echo "PM2 not found. Installing globally..."
    npm install -g pm2
    echo "✅ PM2 installed"
else
    echo "✅ PM2 already installed"
fi
echo ""

echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Verify .env file has correct values"
echo "2. Start application with: pm2 start ecosystem.config.cjs"
echo "3. Check status with: pm2 status"
echo "4. View logs with: pm2 logs quill-your-dream"
echo "5. Save PM2 process list: pm2 save"
echo "6. Set up auto-restart: pm2 startup"
echo ""
echo "📖 For detailed deployment guide, see: DEPLOYMENT_CLOUDWAYS.md"
echo ""

read -p "Start the application now with PM2? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    pm2 start ecosystem.config.cjs
    echo ""
    echo "✅ Application started!"
    echo ""
    pm2 status
    echo ""
    echo "View logs with: pm2 logs quill-your-dream"
else
    echo "To start manually, run: pm2 start ecosystem.config.cjs"
fi
