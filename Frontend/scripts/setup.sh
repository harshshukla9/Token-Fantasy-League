#!/bin/bash

# LootBoxes - Development Setup Script
# This script helps you set up the development environment

set -e

echo "🚀 LootBoxes - Development Setup"
echo "================================="
echo ""

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js 20+ is required. You have: $(node -v)"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"

# Check npm/pnpm
if command -v pnpm &> /dev/null; then
    echo "✅ pnpm version: $(pnpm -v)"
    PACKAGE_MANAGER="pnpm"
elif command -v npm &> /dev/null; then
    echo "✅ npm version: $(npm -v)"
    PACKAGE_MANAGER="npm"
else
    echo "❌ Neither pnpm nor npm is installed"
    exit 1
fi

echo ""
echo "📦 Installing dependencies..."
if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
    pnpm install
else
    npm install
fi

echo ""
echo "📝 Setting up environment files..."

# Frontend
if [ ! -f .env.local ]; then
    if [ -f .env.example ]; then
        cp .env.example .env.local
        echo "✅ Created .env.local"
    else
        echo "⚠️  .env.example not found, skipping .env.local creation"
    fi
else
    echo "⚠️  .env.local already exists"
fi

echo ""
echo "================================="
echo "📋 Next Steps:"
echo "================================="
echo ""
echo "1. Configure your environment variables in:"
echo "   .env.local"
echo ""
echo "2. Start development server:"
if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
    echo "   pnpm dev"
else
    echo "   npm run dev"
fi
echo ""
echo "📖 Check README.md for more information"
echo ""
