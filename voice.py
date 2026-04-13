"""
Voice Input System
Requires: pip install SpeechRecognition pyaudio
"""

import speech_recognition as sr


def capture_voice():
    """
    Capture voice from microphone and convert to text.
    
    Returns:
        str: The recognized text, or None if recognition failed
    """
    recognizer = sr.Recognizer()

    with sr.Microphone() as source:
        print("Speak now...")
        recognizer.adjust_for_ambient_noise(source, duration=0.5)

        try:
            audio = recognizer.listen(source, timeout=5, phrase_time_limit=5)
        except sr.WaitTimeoutError:
            print("Error: No speech detected within timeout period")
            return None

    try:
        text = recognizer.recognize_google(audio)
        print(f"You said: {text}")
        return text
    except sr.UnknownValueError:
        print("Error: Could not understand the audio")
        return None
    except sr.RequestError as e:
        print(f"Error: API failure - {e}")
        return None


def main():
    """Main function to run voice capture."""
    result = capture_voice()
    if result is None:
        print("Voice recognition failed. Please try again.")


if __name__ == "__main__":
    main()
