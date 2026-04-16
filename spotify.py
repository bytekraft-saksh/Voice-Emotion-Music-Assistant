"""
Spotify Song Recommendation Module
Requires: pip install spotipy python-dotenv
"""

from dotenv import load_dotenv
load_dotenv()

import os
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials

# Global Spotify client (loaded once)
sp = None

# ✅ Improved Emotion to Spotify query mapping
EMOTION_QUERIES = {
    "happy": "happy upbeat songs bollywood OR english",
    "sad": "sad emotional songs bollywood OR english",
    "angry": "intense rock workout songs",
    "anxious": "calm relaxing meditation music",
    "calm": "lofi chill relaxing beats",
    "romantic": "romantic love songs bollywood OR english"
}


def get_spotify_client():
    global sp

    if sp is None:
        client_id = os.getenv("SPOTIPY_CLIENT_ID")
        client_secret = os.getenv("SPOTIPY_CLIENT_SECRET")

        if not client_id or not client_secret:
            raise ValueError("SPOTIPY_CLIENT_ID and SPOTIPY_CLIENT_SECRET must be set")

        client_credentials_manager = SpotifyClientCredentials(
            client_id=client_id,
            client_secret=client_secret
        )

        sp = spotipy.Spotify(client_credentials_manager=client_credentials_manager)

    return sp


def get_songs(emotion):
    """
    Fetch up to 10 songs from Spotify based on emotion.
    """

    # Safety fallback
    if not emotion:
        emotion = "calm"

    try:
        spotify_client = get_spotify_client()
    except ValueError as e:
        print(f"Error: {e}")
        return []
    except Exception as e:
        print(f"Error connecting to Spotify: {e}")
        return []

    # ✅ Improved query logic (stronger search)
    base_query = EMOTION_QUERIES.get(emotion.lower(), "")
    query = f"{base_query} songs playlist music"

    print(f"🎯 Emotion: {emotion}")
    print(f"🔍 Query: {query}")

    try:
        results = spotify_client.search(q=query, type="track", limit=10)
    except Exception as e:
        print(f"Error searching Spotify: {e}")
        return []

    tracks = results.get("tracks", {}).get("items", [])

    if not tracks:
        print("No songs found for this emotion.")
        return []

    songs = []

    for track in tracks:
        song_info = {
            "song": track.get("name", "Unknown"),
            "artist": ", ".join(
                artist.get("name", "Unknown") for artist in track.get("artists", [])
            ),
            "url": track.get("external_urls", {}).get("spotify", "")
        }
        songs.append(song_info)

    return songs


def search_song_by_query(query):
    """
    Search for a single song by query string.
    Returns the first matching track.
    """
    if not query:
        return None

    try:
        spotify_client = get_spotify_client()
    except (ValueError, Exception) as e:
        print(f"Error connecting to Spotify: {e}")
        return None

    try:
        results = spotify_client.search(q=query, type="track", limit=1)
    except Exception as e:
        print(f"Error searching Spotify: {e}")
        return None

    tracks = results.get("tracks", {}).get("items", [])

    if not tracks:
        print(f"No songs found for query: {query}")
        return None

    track = tracks[0]
    track_id = track.get("id", "")

    song_info = {
        "song": track.get("name", "Unknown"),
        "artist": ", ".join(
            artist.get("name", "Unknown") for artist in track.get("artists", [])
        ),
        "url": track.get("external_urls", {}).get("spotify", ""),
        "embed_url": f"https://open.spotify.com/embed/track/{track_id}" if track_id else ""
    }

    return song_info