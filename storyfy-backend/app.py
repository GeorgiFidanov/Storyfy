from flask import Flask, request, jsonify, session, redirect, url_for
import requests
from PIL import Image, ImageDraw
from io import BytesIO
import base64
import os
from dotenv import load_dotenv
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
from urllib.parse import quote
import pylast
import replicate
from diffusers import StableDiffusionPipeline
import torch
from huggingface_hub import login

load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)

# Update CORS configuration
CORS(app, supports_credentials=True, resources={
    r"/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "supports_credentials": True,
        "expose_headers": ["Set-Cookie"]
    }
})

# Update redirect URI to backend URL
REDIRECT_URI = 'http://localhost:5000/callback'

# MongoDB setup
MONGO_URI = os.getenv('MONGO_URI')
client = MongoClient(MONGO_URI)
db = client.Storyfy
users_collection = db["Users_data"]

CLIENT_ID = os.getenv('CLIENT_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET')
SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize'
SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
SPOTIFY_API_URL = 'https://api.spotify.com/v1/'

# Add Last.fm setup
LASTFM_API_KEY = os.getenv('LASTFM_API_KEY')
LASTFM_API_SECRET = os.getenv('LASTFM_API_SECRET')
LASTFM_NETWORK = pylast.LastFMNetwork(
    api_key=LASTFM_API_KEY,
    api_secret=LASTFM_API_SECRET
)

# Add Hugging Face setup
HUGGINGFACE_TOKEN = os.getenv('HUGGINGFACE_TOKEN')
login(HUGGINGFACE_TOKEN)  # Login to Hugging Face

# Initialize the model
model_id = "CompVis/stable-diffusion-v1-4"
pipe = StableDiffusionPipeline.from_pretrained(
    model_id,
    torch_dtype=torch.float32,
    use_auth_token=HUGGINGFACE_TOKEN
)
if torch.cuda.is_available():
    pipe = pipe.to("cuda")
else:
    pipe = pipe.to("cpu")

@app.route('/')
def index():
    return jsonify({"message": "Storyfy API is running"}), 200

@app.route('/login')
def login():
    try:
        scope = ' '.join([
            'playlist-read-private',
            'user-read-private',
            'user-read-email',
            'playlist-read-collaborative',
            'user-library-read',
            'user-read-currently-playing',
            'user-read-playback-state',
            'user-read-recently-played',
            'user-top-read',
            'user-read-playback-position',
            'streaming',
            'app-remote-control'
        ])
        
        # URL encode the scope
        encoded_scope = quote(scope)
        
        auth_url = f"{SPOTIFY_AUTH_URL}?response_type=code&client_id={CLIENT_ID}&scope={encoded_scope}&redirect_uri={REDIRECT_URI}"
        print("\nAuth URL generated:")
        print("Scope:", scope)
        print("URL:", auth_url[:100] + "...")  # Print first 100 chars for readability
        
        return redirect(auth_url)
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({"error": "Login failed"}), 500

@app.route('/callback')
def callback():
    try:
        code = request.args.get('code')
        if not code:
            return jsonify({"error": "No code provided"}), 400

        print(f"Received auth code: {code}")

        response = requests.post(SPOTIFY_TOKEN_URL, data={
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': REDIRECT_URI,
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET
        })
        
        if response.status_code != 200:
            print(f"Spotify token error: {response.text}")
            return jsonify({"error": "Failed to get access token"}), 500

        data = response.json()
        session['access_token'] = data['access_token']
        
        # Print detailed token info
        print("\nToken Response:")
        print("Access Token:", data['access_token'][:20] + "...")  # Print first 20 chars for security
        print("Token Type:", data.get('token_type'))
        print("Expires In:", data.get('expires_in'))
        print("Refresh Token:", bool(data.get('refresh_token')))
        print("Scopes Granted:", data.get('scope', 'No scopes found').split())
        
        # Test the token immediately
        test_headers = {'Authorization': f'Bearer {data["access_token"]}'}
        test_response = requests.get(f'{SPOTIFY_API_URL}audio-features/11dFghVXANMlKmJXsNCbNl', headers=test_headers)
        print("\nImmediate token test:")
        print("Status:", test_response.status_code)
        print("Response:", test_response.text[:200] + "..." if test_response.text else "No response body")
        
        # Get user profile information
        headers = {'Authorization': f'Bearer {data["access_token"]}'}
        user_profile = requests.get(f'{SPOTIFY_API_URL}me', headers=headers).json()
        
        # Store user login information
        user_data = {
            'spotify_id': user_profile['id'],
            'email': user_profile.get('email'),
            'display_name': user_profile.get('display_name'),
            'last_login': datetime.now()
        }
        
        users_collection.update_one(
            {'spotify_id': user_profile['id']},
            {'$set': user_data},
            upsert=True
        )
        
        session['user_id'] = user_profile['id']
        
        # Redirect to frontend after successful authentication
        return redirect('http://localhost:5173')
    except Exception as e:
        print(f"Callback error: {str(e)}")
        return jsonify({"error": "Callback failed"}), 500

@app.route('/api/playlists', methods=['GET'])
def get_playlists():
    if 'access_token' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    token = session['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    all_playlists = []
    next_url = f'{SPOTIFY_API_URL}me/playlists?limit=50'

    try:
        while next_url:
            response = requests.get(next_url, headers=headers)
            if response.status_code != 200:
                return jsonify({'error': 'Failed to fetch playlists'}), response.status_code
            
            data = response.json()
            all_playlists.extend(data['items'])
            next_url = data.get('next')  # Get next page URL if it exists

        print(f"Total playlists fetched: {len(all_playlists)}")
        return jsonify(all_playlists)
    except Exception as e:
        print(f"Error fetching playlists: {str(e)}")
        return jsonify({'error': str(e)}), 500

def get_lastfm_features(artist_name, track_name):
    try:
        # Get track from Last.fm
        track = LASTFM_NETWORK.get_track(artist_name, track_name)
        
        # Get track tags
        tags = track.get_top_tags(limit=10)
        if not tags:
            print(f"No tags found for: {artist_name} - {track_name}")
            return None
        
        # Calculate features based on tags
        features = {
            'energy': 0.0,
            'danceability': 0.0,
            'valence': 0.0,
            'acousticness': 0.0,
            'instrumentalness': 0.0
        }
        
        # Extended tag mappings
        tag_mappings = {
            # Energy tags
            'energetic': ('energy', 1.0),
            'powerful': ('energy', 1.0),
            'intense': ('energy', 1.0),
            'mellow': ('energy', -0.5),
            'calm': ('energy', -0.5),
            
            # Dance tags
            'dance': ('danceability', 1.0),
            'club': ('danceability', 1.0),
            'party': ('danceability', 1.0),
            'groove': ('danceability', 0.8),
            'rhythm': ('danceability', 0.6),
            
            # Mood tags
            'happy': ('valence', 1.0),
            'uplifting': ('valence', 1.0),
            'fun': ('valence', 0.8),
            'sad': ('valence', -0.5),
            'melancholic': ('valence', -0.5),
            
            # Sound tags
            'acoustic': ('acousticness', 1.0),
            'electronic': ('acousticness', -0.5),
            'instrumental': ('instrumentalness', 1.0),
            'vocal': ('instrumentalness', -0.5)
        }
        
        # Process tags and handle weight conversion
        feature_weights = {feature: 0.0 for feature in features}
        feature_counts = {feature: 0 for feature in features}
        
        for tag in tags:
            try:
                tag_name = tag.item.get_name().lower()
                # Convert weight to float, handle potential string weights
                try:
                    weight = float(tag.weight)
                except (TypeError, ValueError):
                    weight = 50.0  # Default weight if conversion fails
                
                # Normalize weight to 0-1 range
                weight = weight / 100.0
                
                for keyword, (feature, impact) in tag_mappings.items():
                    if keyword in tag_name:
                        feature_weights[feature] += impact * weight
                        feature_counts[feature] += 1
                        print(f"Tag match: {tag_name} -> {feature} (weight: {weight}, impact: {impact})")
            except Exception as tag_error:
                print(f"Error processing tag: {str(tag_error)}")
                continue
        
        # Normalize features
        for feature in features:
            if feature_counts[feature] > 0:
                # Average the weights and normalize to 0-1 range
                raw_value = feature_weights[feature] / feature_counts[feature]
                features[feature] = max(0.0, min(1.0, (raw_value + 1) / 2))
            else:
                features[feature] = 0.5  # Default middle value if no tags matched
        
        print(f"Calculated features for {artist_name} - {track_name}:", features)
        return features
        
    except Exception as e:
        print(f"Error getting Last.fm features for {artist_name} - {track_name}: {str(e)}")
        return None

@app.route('/api/playlist_tracks', methods=['GET'])
def get_playlist_tracks():
    if 'access_token' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    playlist_id = request.args.get('playlist_id')
    token = session['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    try:
        response = requests.get(f'{SPOTIFY_API_URL}playlists/{playlist_id}/tracks', headers=headers)
        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch playlist tracks'}), response.status_code
            
        tracks = response.json().get('items', [])
        print(f"Found {len(tracks)} tracks in playlist")
        
        track_list = []

        for item in tracks:
            track = item.get('track')
            if not track:
                continue

            track_info = {
                'id': track['id'],
                'name': track['name'],
                'album_name': track['album']['name'],
                'album_image': track['album']['images'][0]['url'] if track['album']['images'] else None,
                'artist_name': ', '.join(artist['name'] for artist in track['artists']),
                'duration_ms': track['duration_ms'],
                'external_url': track['external_urls']['spotify'],
                'has_features': False  # Default to false
            }

            primary_artist = track['artists'][0]['name']
            features = get_lastfm_features(primary_artist, track['name'])
            
            if features:
                track_info.update(features)
                track_info['has_features'] = True
                print(f"Added features for: {primary_artist} - {track['name']}")
            else:
                # Set default features
                track_info.update({
                    'energy': 0.5,
                    'danceability': 0.5,
                    'valence': 0.5,
                    'acousticness': 0.5,
                    'instrumentalness': 0.5
                })
                print(f"Using default features for: {primary_artist} - {track['name']}")

            track_list.append(track_info)

        return jsonify(track_list)

    except Exception as e:
        print(f"Error in playlist_tracks endpoint: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate_image', methods=['POST'])
def generate_image():
    if 'access_token' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    try:
        data = request.get_json()
        if not data:
            print("No JSON data received")
            return jsonify({'error': 'No data provided'}), 400

        track_info = data.get('track_info')
        if not track_info:
            print("No track_info in request data:", data)
            return jsonify({'error': 'No track info provided'}), 400

        # Create prompt based on audio features
        prompt = create_image_prompt(track_info)
        print(f"Generated prompt: {prompt}")

        # Generate image
        with torch.no_grad():
            image = pipe(prompt).images[0]

        # Convert PIL image to base64
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        image_data = base64.b64encode(buffered.getvalue()).decode('utf-8')

        # Store the generated image
        image_metadata = {
            'user_id': session['user_id'],
            'timestamp': datetime.utcnow(),
            'track_info': track_info,
            'prompt': prompt,
            'image_data': image_data
        }
        
        users_collection.update_one(
            {'spotify_id': session['user_id']},
            {'$push': {'generated_images': image_metadata}}
        )

        return jsonify({
            'image_data': image_data,
            'prompt': prompt
        })

    except Exception as e:
        print(f"Error generating image: {str(e)}")
        return jsonify({'error': str(e)}), 500

def create_image_prompt(track_info):
    """Create an image generation prompt based on track features"""
    
    # Base style for all images
    base_style = "digital art, high quality, detailed, vibrant"
    
    # Map features to visual elements
    energy_desc = get_energy_description(track_info.get('energy', 0.5))
    mood_desc = get_mood_description(track_info.get('valence', 0.5))
    movement_desc = get_movement_description(track_info.get('danceability', 0.5))
    texture_desc = get_texture_description(
        track_info.get('acousticness', 0.5),
        track_info.get('instrumentalness', 0.5)
    )

    # Combine all elements into a prompt
    prompt = f"A {energy_desc}, {mood_desc} abstract composition with {movement_desc} and {texture_desc}, {base_style}"
    
    print(f"Generated prompt: {prompt}")
    return prompt

def get_energy_description(energy):
    if energy > 0.7:
        return "dynamic, explosive, intense"
    elif energy > 0.4:
        return "flowing, balanced"
    else:
        return "calm, subtle"

def get_mood_description(valence):
    if valence > 0.7:
        return "bright and uplifting"
    elif valence > 0.4:
        return "balanced and harmonious"
    else:
        return "moody and atmospheric"

def get_movement_description(danceability):
    if danceability > 0.7:
        return "rhythmic flowing patterns"
    elif danceability > 0.4:
        return "gentle flowing elements"
    else:
        return "static, structured elements"

def get_texture_description(acousticness, instrumentalness):
    textures = []
    if acousticness > 0.6:
        textures.append("organic textures")
    elif acousticness < 0.4:
        textures.append("digital patterns")
    
    if instrumentalness > 0.6:
        textures.append("abstract forms")
    else:
        textures.append("emotive shapes")
    
    return ", ".join(textures)

# New endpoint to get user's generated images
@app.route('/api/user/images', methods=['GET'])
def get_user_images():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
        
    user = users_collection.find_one({'spotify_id': session['user_id']})
    if not user or 'generated_images' not in user:
        return jsonify({'images': []})
        
    # Return the list of generated images with their metadata
    return jsonify({'images': user['generated_images']})

@app.route('/api/test-audio-features', methods=['GET'])
def test_audio_features():
    if 'access_token' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    token = session['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    try:
        # Test with "Bohemian Rhapsody" by Queen (a well-known track)
        test_track_id = '3z8h0TU7ReDPLIbEnYhWZb'

        # First, test getting track info
        track_response = requests.get(
            f'{SPOTIFY_API_URL}tracks/{test_track_id}',
            headers=headers
        )
        print("\nTrack Info Response:")
        print(f"Status: {track_response.status_code}")
        print(f"Response: {track_response.text[:200]}...")

        # Then test audio features
        features_response = requests.get(
            f'{SPOTIFY_API_URL}audio-features/{test_track_id}',
            headers=headers
        )
        print("\nAudio Features Response:")
        print(f"Status: {features_response.status_code}")
        print(f"Response: {features_response.text}")

        # Also test the batch endpoint
        batch_response = requests.get(
            f'{SPOTIFY_API_URL}audio-features?ids={test_track_id}',
            headers=headers
        )
        print("\nBatch Audio Features Response:")
        print(f"Status: {batch_response.status_code}")
        print(f"Response: {batch_response.text}")

        return jsonify({
            'track_info': {
                'status': track_response.status_code,
                'data': track_response.json() if track_response.status_code == 200 else track_response.text
            },
            'audio_features': {
                'status': features_response.status_code,
                'data': features_response.json() if features_response.status_code == 200 else features_response.text
            },
            'batch_features': {
                'status': batch_response.status_code,
                'data': batch_response.json() if batch_response.status_code == 200 else batch_response.text
            }
        })

    except Exception as e:
        print(f"Test endpoint error: {str(e)}")
        return jsonify({'error': str(e)}), 500

def refresh_token():
    if 'refresh_token' not in session:
        return False
        
    response = requests.post(SPOTIFY_TOKEN_URL, data={
        'grant_type': 'refresh_token',
        'refresh_token': session['refresh_token'],
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
    })
    
    if response.status_code == 200:
        data = response.json()
        session['access_token'] = data['access_token']
        if 'refresh_token' in data:  # Sometimes Spotify sends a new refresh token
            session['refresh_token'] = data['refresh_token']
        return True
    return False

def get_spotify_token():
    if 'access_token' not in session:
        return None
        
    # Test the current token
    headers = {'Authorization': f'Bearer {session["access_token"]}'}
    test_response = requests.get(f'{SPOTIFY_API_URL}me', headers=headers)
    
    if test_response.status_code == 401:  # Token expired
        if refresh_token():
            return session['access_token']
        return None
    
    return session['access_token']

if __name__ == '__main__':
    try:
        print("Starting Storyfy API server...")
        app.run(port=5000, debug=True)
    except Exception as e:
        print(f"Server error: {str(e)}")
