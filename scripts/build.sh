#!/bin/bash
set -e

echo "🏗️  Building Shushan Aleksanyan Portfolio..."

echo "📦 Step 1: Building client with Vite..."
vite build

echo "🎨 Step 2: Pre-rendering static pages with SSR data..."
tsx scripts/prerender-ssr.tsx

echo "⚙️  Step 3: Building server..."
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "✨ Build complete! Ready for production."
