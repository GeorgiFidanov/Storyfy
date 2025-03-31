#!/bin/bash
echo "Installing dependencies..."

# Install backend dependencies
cd Storyfy
pip install -r requirements.txt

# Install frontend dependencies
cd ../storyfy-frontend
npm install
npm install react-router-dom

echo "Setup complete!" 