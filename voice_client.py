"""
Voice to Emotion Client
Connects voice input with the emotion detection API.
Requires: pip install requests
"""

import re
import webbrowser
import requests
from voice import capture_voice
from spotify import get_songs

API_URL = "http://127.0.0.1:5000/analyze"


def get_voice_choice():
    """
    Capture voice input and extract a number for song selection.
    
    Returns:
        int or None: Extracted song number, or None if failed
    """
    print("\n🎤 Say the song number to play (e.g., 'play song 3' or 'number 5')...")
    voice_text = capture_voice()
    
    if voice_text is None:
        print("❌ Could not understand voice input.")
        return None
    
    # Extract first number from text
    numbers = re.findall(r'\d+', voice_text)
    if numbers:
        return int(numbers[0])
    else:
        print(f"❌ No number found in: '{voice_text}'")
        return None


def display_songs(songs):
    """
    Display songs and get user selection via typing or voice.
    
    Args:
        songs (list): List of song dictionaries
        
    Returns:
        dict: Selected song or None
    """
    print("\n🎵 Recommended Songs:\n")
    for idx, song in enumerate(songs, 1):
        print(f"{idx}. {song['song']} - {song['artist']}")

    print("\nChoose input method:")
    print("1. Type number")
    print("2. Speak selection")
    
    method = input("\nEnter 1 or 2: ").strip()
    
    if method == "2":
        # Voice selection
        choice = get_voice_choice()
        if choice is None:
            print("\n⚠️ Voice input failed. Falling back to typing...")
            try:
                choice = int(input("Select a song number: "))
            except ValueError:
                print("Invalid input.")
                return None
    else:
        # Typing selection
        try:
            choice = int(input("\nSelect a song number: "))
        except ValueError:
            print("Invalid input. Please enter a number.")
            return None
    
    if 1 <= choice <= len(songs):
        return songs[choice - 1]
    else:
        print("Invalid selection. Please choose a valid number.")
        return None


def get_emotion_from_api(text):
    """
    Send text to API and return emotion data.
    """
    try:
        response = requests.post(
            API_URL,
            json={"text": text},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        response.raise_for_status()
        return response.json()

    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to API. Is the server running?")
    except requests.exceptions.Timeout:
        print("❌ Error: API request timed out.")
    except requests.exceptions.RequestException as e:
        print(f"❌ Error: Request failed - {e}")

    return None


def main():
    print("\n🎤 Voice Emotion Music Assistant Started")

    # Capture voice input
    text = capture_voice()

    if text is None:
        print("❌ No voice input captured. Exiting.")
        return

    # Get emotion from API
    data = get_emotion_from_api(text)

    if not data or "emotion" not in data:
        print("❌ Invalid response from API")
        return

    emotion = data.get("emotion", {})

    print(f"\n🗣️ You said: {data.get('input_text', text)}")
    print(f"🧠 Emotion: {emotion.get('raw_emotion', 'N/A')}")
    print(f"💭 Mood: {emotion.get('final_emotion', 'N/A')}")

    confidence = emotion.get("confidence")
    if confidence is not None:
        print(f"📊 Confidence: {confidence:.2f}")
    else:
        print("📊 Confidence: N/A")

    # Get emotion for Spotify
    final_emotion = emotion.get("final_emotion") or "calm"

    print("\n🔍 Fetching songs from Spotify...")

    songs = get_songs(final_emotion)

    if not songs:
        print("❌ Could not fetch songs.")
        return

    # Let user pick a song
    selected_song = display_songs(songs)

    if selected_song:
        print(f"\n🎧 Playing: {selected_song['song']} by {selected_song['artist']}")
        if selected_song.get("url"):
            webbrowser.open(selected_song["url"])
        else:
            print("⚠️ No Spotify URL available.")

    print("\n✅ Session ended.")


if __name__ == "__main__":
    main()