#!/usr/bin/env bash
# Quick start script for NP Copilot backend

set -e

echo "🔬 NP Copilot - Natural Products Chemistry Intelligence Platform"
echo "================================================================"
echo ""

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "✓ Python version: $python_version"

# Install in development mode
echo ""
echo "📦 Installing dependencies..."
pip install -e ".[dev]" --quiet

# Run tests
echo ""
echo "🧪 Running tests..."
pytest tests/ -v --cov=src/crowe_copilot --cov-report=term-missing

# Show CLI help
echo ""
echo "📋 Available CLI commands:"
echo ""
python -m crowe_copilot.cli --help

echo ""
echo "✅ Setup complete!"
echo ""
echo "Quick examples:"
echo "  np-copilot standardize input.csv output.xlsx --mordred"
echo "  np-copilot fetch chembl caffeine --limit 10"
echo "  np-copilot serve --port 8000"
echo ""
echo "API documentation: http://localhost:8000/docs (after running 'serve')"
