
# Storyfy 🎵🎨

Storyfy is a web application that generates unique visual art based on the musical characteristics of songs from your Spotify playlists. In other words, Storyfy is trying to capture the energy of a selected song's melody. By analyzing audio features and using AI image generation, Storyfy creates personalized artwork that represents the mood, energy, and style of your favorite tracks.

## Features

- 🔐 Spotify Authentication
- 📋 View all your Spotify playlists
- 🎵 Browse tracks within playlists
- 🎨 Generate unique artwork for selected songs
- 💾 Save generated images
- 🎭 Audio feature visualization

## Prerequisites

Before running Storyfy, make sure you have:

- Python 3.8 or higher
- Node.js 14 or higher
- MongoDB installed or MongoDB Atlas account
- Spotify Developer account
- Last.fm API account
- Hugging Face account

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/GeorgiFidanov/Storyfy.git
cd Storyfy
```

### Optional. Now you can set up the application by running the correct setup file(depending on the local OS). This way steps 2 and 3 can be skipped

### 2. Set Up Backend

```bash
# Navigate to backend directory
cd storyfy-backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Set Up Frontend

```bash
# Navigate to frontend directory
cd storyfy-frontend

# Install dependencies
npm install
```

### 4. Get Required API Keys

#### Spotify API

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new application
3. Set the redirect URI to `http://localhost:5000/callback`
4. Copy the Client ID and Client Secret

#### Last.fm API

1. Create an account at [Last.fm](https://www.last.fm/)
2. Get API credentials from [Last.fm API](https://www.last.fm/api/account/create)

#### Hugging Face

1. Create an account at [Hugging Face](https://huggingface.co/)
2. Go to Settings > Access Tokens
3. Create a new token with "read" permissions

#### MongoDB

1. Set up a MongoDB database (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
2. Get your connection string

### 5. Environment Setup

Create a `.env` file in the backend directory with your API keys:

```env
CLIENT_ID=your_spotify_client_id
CLIENT_SECRET=your_spotify_client_secret
MONGO_URI=your_mongodb_uri
LASTFM_API_KEY=your_lastfm_api_key
LASTFM_API_SECRET=your_lastfm_api_secret
HUGGINGFACE_TOKEN=your_huggingface_token
```

### 6. Running the Application

Start the backend server:

The application can be ran through the correct run file(again, depending on the local OS). Or:

```bash
# From the Storyfy directory
python app.py
```

Start the frontend development server:

```bash
# From the storyfy-frontend directory
npm run dev
```

Access the application at `http://localhost:5173`

## Usage

1. Open the application in your browser
2. Click "Login with Spotify"
3. Authorize the application
4. Select a playlist from your library
5. Choose a track from the playlist
6. Click "Generate Visualization" to create artwork
7. The generated image will appear below

## Troubleshooting

### Common Issues

1. **Spotify Authentication Failed**
   - Verify your Client ID and Secret
   - Check redirect URI configuration
   - Ensure cookies are enabled in your browser

2. **Image Generation Issues**
   - Verify Hugging Face token permissions
   - Check Python dependencies are installed correctly
   - Ensure sufficient system resources

3. **MongoDB Connection Issues**
   - Verify MongoDB is running (if local)
   - Check connection string in .env file
   - Ensure network connectivity

## Technical Stack

- **Frontend**: React, Vite
- **Backend**: Flask
- **Database**: MongoDB
- **APIs**:

  - Spotify Web API
  - Last.fm API
  - Hugging Face Diffusers
