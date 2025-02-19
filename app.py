from flask import Flask, request, jsonify, session, redirect, url_for
import requests
from PIL import Image, ImageDraw
from io import BytesIO
import base64
import os
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)

CORS(app, supports_credentials=True)

CLIENT_ID = os.getenv('CLIENT_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET')
REDIRECT_URI = 'http://localhost:3000/callback'
SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize'
SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
SPOTIFY_API_URL = 'https://api.spotify.com/v1/'

@app.route('/login')
def login():
    scope = 'playlist-read-private user-read-private user-read-email'
    auth_url = f"{SPOTIFY_AUTH_URL}?response_type=code&client_id={CLIENT_ID}&scope={scope}&redirect_uri={REDIRECT_URI}"
    return redirect(auth_url)

@app.route('/callback')
def callback():
    code = request.args.get('code')
    response = requests.post(SPOTIFY_TOKEN_URL, data={
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
    })
    data = response.json()
    session['access_token'] = data['access_token']
    return redirect('http://localhost:5173')

@app.route('/api/playlists', methods=['GET'])
def get_playlists():
    if 'access_token' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    token = session['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    response = requests.get(f'{SPOTIFY_API_URL}me/playlists', headers=headers)
    playlists = response.json().get('items', [])

    return jsonify(playlists)

@app.route('/api/playlist_tracks', methods=['GET'])
def get_playlist_tracks():
    if 'access_token' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    playlist_id = request.args.get('playlist_id')
    token = session['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    response = requests.get(f'{SPOTIFY_API_URL}playlists/{playlist_id}/tracks', headers=headers)
    tracks = response.json().get('items', [])

    # Extract relevant track info
    track_list = []
    for item in tracks:
        track = item.get('track')
        if track:
            track_list.append({
                'id': track['id'],
                'name': track['name'],
                'artists': ', '.join([artist['name'] for artist in track['artists']])
            })

    return jsonify(track_list)

@app.route('/api/generate_image', methods=['POST'])
def generate_image():
    if 'access_token' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    data = request.get_json()
    track_id = data.get('track_id')

    token = session['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    features_url = f'{SPOTIFY_API_URL}audio-features/{track_id}'
    features_response = requests.get(features_url, headers=headers).json()

    if 'tempo' not in features_response:
        return jsonify({'error': 'Audio features not available'}), 500

    tempo = features_response['tempo']
    energy = features_response['energy']

    img = Image.new('RGB', (500, 500), color=(int(tempo % 256), int(energy * 255), 150))
    draw = ImageDraw.Draw(img)
    draw.text((10, 10), f"Tempo: {tempo}\nEnergy: {energy:.2f}", fill=(255, 255, 255))

    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

    return jsonify({'image_data': img_base64})


if __name__ == '__main__':
    app.run(port=3000, debug=True)
