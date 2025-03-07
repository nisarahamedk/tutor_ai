#!/bin/bash
set -e

# Install poetry if not already installed
if ! command -v poetry &> /dev/null; then
    curl -sSL https://install.python-poetry.org | python3 -
fi

# Initialize poetry and install dependencies
poetry install

# Generate/update lock file if it doesn't exist
if [ ! -f poetry.lock ]; then
    poetry lock
fi