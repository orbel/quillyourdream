#!/bin/sh

# Docker initialization script
# Just starts the application (data import done manually)

set -e

echo "🚀 Starting Quill Your Dream..."

# Start the application
exec node dist/index.js
