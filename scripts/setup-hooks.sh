#!/bin/bash

# Configure git to use the .githooks directory for hooks
git config core.hooksPath .githooks

# Ensure hooks are executable
chmod +x .githooks/*

echo "✅ Git hooks configured successfully."
