from flask import Flask, redirect, request, session, render_template, url_for
import requests
from PIL import Image, ImageDraw
from io import BytesIO
import base64
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)

CLIENT_ID = os.getenv('CLIENT_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET')
REDIRECT_URI = 'http://localhost:3000/callback'
SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize'
SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
SPOTIFY_API_URL = 'https://api.spotify.com/v1/'

@app.route('/')
def home():
    return render_template('index.html', logged_in=('access_token' in session))

@app.route('/login')
def login():
    scope = 'user-read-private user-read-email'
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
    return redirect(url_for('generate_image_form'))

@app.route('/generate', methods=['GET', 'POST'])
def generate_image_form():
    image_data = None
    song_name = None
    if 'access_token' not in session:
        return redirect(url_for('login'))

    if request.method == 'POST':
        song_name = request.form['song_name']
        token = session['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        # Search for song
        search_url = f'{SPOTIFY_API_URL}search'
        search_params = {'q': song_name, 'type': 'track', 'limit': 1}
        search_response = requests.get(search_url, headers=headers, params=search_params).json()
        track_id = search_response['tracks']['items'][0]['id']

        # Get audio features
        features_url = f'{SPOTIFY_API_URL}audio-features/{track_id}'
        features_response = requests.get(features_url, headers=headers).json()
        tempo = features_response['tempo']
        energy = features_response['energy']

        # Generate image
        img = Image.new('RGB', (500, 500), color=(int(tempo % 256), int(energy * 255), 150))
        draw = ImageDraw.Draw(img)
        draw.text((10, 10), f"Tempo: {tempo}\nEnergy: {energy:.2f}", fill=(255, 255, 255))

        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        image_data = img_base64

    return render_template('generate.html', image_data=image_data, song_name=song_name)

if __name__ == '__main__':
    app.run(port=3000, debug=True)
