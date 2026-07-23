#!/bin/bash
# Build zip for ServerKit extension

set -e

# Resolve repo root from script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# Get version from plugin.json
VERSION=$(grep '"version"' plugin.json | cut -d'"' -f4)
SLUG=$(grep '"name"' plugin.json | cut -d'"' -f4)

echo "Building $SLUG v$VERSION..."

# Create dist directory
mkdir -p dist

# Create temporary build directory
BUILD_DIR=$(mktemp -d)
cp -r plugin.json "$BUILD_DIR/"
cp -r LICENSE "$BUILD_DIR/"
cp -r README.md "$BUILD_DIR/"

# Copy backend if exists
if [ -d "backend" ]; then
    cp -r backend "$BUILD_DIR/"
fi

# Copy frontend dist if exists
if [ -d "frontend/dist" ]; then
    mkdir -p "$BUILD_DIR/frontend"
    cp -r frontend/dist "$BUILD_DIR/frontend/"
fi

# Create zip
cd "$BUILD_DIR"
zip -r "$REPO_ROOT/dist/$SLUG-$VERSION.zip" .

# Cleanup
rm -rf "$BUILD_DIR"

echo "Built: dist/$SLUG-$VERSION.zip"
