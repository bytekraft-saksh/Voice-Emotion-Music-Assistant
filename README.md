# 🎤 Voice Emotion Music Assistant

An AI-powered web application that detects your emotional state from voice input and recommends songs from Spotify that match your mood.

![Flask](https://img.shields.io/badge/Flask-000000?style=flat&logo=flask&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
![Spotify](https://img.shields.io/badge/Spotify-1DB954?style=flat&logo=spotify&logoColor=white)
![Transformers](https://img.shields.io/badge/🤗_Transformers-FF6B6B?style=flat)

## ✨ Features

- **🎙️ Voice Input**: Capture speech via microphone using Google's Speech Recognition
- **🧠 AI Emotion Detection**: Classifies emotions into 6 categories using a fine-tuned transformer model (GoEmotions-based)
  - Happy, Sad, Angry, Anxious, Romantic, Calm
- **🎵 Spotify Integration**: Fetches up to 10 song recommendations based on detected emotion
- **🌐 Web Interface**: Beautiful glassmorphism UI with real-time voice processing
- **💻 CLI Mode**: Terminal-based client for voice-driven music selection

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Spotify Developer Account (for API credentials)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bytekraft-saksh/Voice-Emotion-Music-Assistant.git
   cd Voice-Emotion-Music-Assistant
   ```

2. **Install dependencies**
   ```bash
   pip install flask spotipy python-dotenv transformers speechrecognition pyaudio requests
   ```

3. **Download the emotion detection model**
   
   The model files are excluded from Git due to size. Download the fine-tuned GoEmotions model and place these files in the `model/` directory:
   - `config.json`
   - `tokenizer.json`
   - `tokenizer_config.json`
   - `model.safetensors` (or `pytorch_model.bin`)

4. **Set up environment variables**
   
   Create a `.env` file in the project root:
   ```env
   SPOTIPY_CLIENT_ID=your_spotify_client_id
   SPOTIPY_CLIENT_SECRET=your_spotify_client_secret
   ```

### Running the Application

**Web Interface:**
```bash
python app.py
```
Open http://127.0.0.1:5000 in your browser

**CLI Client:**
```bash
# Terminal 1: Start the API server
python app.py

# Terminal 2: Run the voice client
python voice_client.py
```

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   User Input    │────▶│  Emotion        │────▶│  Spotify API    │
│  (Voice/Text)   │     │  Detection      │     │  (Song Recs)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Flask Web     │     │  🤗 Transformers│     │  Web/CLI Output │
│   Interface     │     │  (GoEmotions)   │     │  (Songs + URLs) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 📁 Project Structure

```
Voice-Emotion-Music-Assistant/
├── app.py              # Flask web server + API endpoints
├── emotion.py          # Emotion detection (transformers pipeline)
├── spotify.py          # Spotify API integration
├── voice.py            # Speech recognition module
├── voice_client.py     # CLI client with voice interaction
├── templates/
│   └── index.html      # Web UI (glassmorphism design)
├── static/
│   ├── style.css       # Modern glassmorphism styling
│   └── script.js       # Frontend JavaScript
├── model/              # Local transformer model files
│   ├── config.json
│   ├── tokenizer.json
│   └── tokenizer_config.json
├── .env                # Environment variables (not in git)
└── .gitignore          # Excludes model weights, env files, cache
```

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Web interface |
| `/analyze` | POST | Analyze text emotion (JSON: `{"text": "..."}`) |
| `/songs` | GET | Get songs by emotion (query: `?emotion=happy`) |

**Example API usage:**
```bash
curl -X POST http://127.0.0.1:5000/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "I am feeling so happy today!"}'
```

Response:
```json
{
  "input_text": "I am feeling so happy today!",
  "emotion": {
    "raw_emotion": "joy",
    "final_emotion": "happy",
    "confidence": 0.95
  }
}
```

## 🎭 Emotion Mapping

The system maps 27 GoEmotions labels into 6 actionable categories:

| Category | Source Emotions | Spotify Query |
|----------|----------------|---------------|
| **Happy** | joy, amusement, excitement | happy upbeat songs |
| **Sad** | sadness, disappointment, grief | sad emotional songs |
| **Angry** | anger, annoyance | intense rock workout |
| **Anxious** | fear, nervousness | calm relaxing meditation |
| **Romantic** | love, admiration | romantic love songs |
| **Calm** | neutral, others (default) | lofi chill relaxing beats |

## 🛠️ Technologies Used

- **Backend**: Flask, Python
- **ML/NLP**: Hugging Face Transformers (GoEmotions model)
- **Speech Recognition**: SpeechRecognition (Google Speech API)
- **Music API**: Spotipy (Spotify Web API)
- **Frontend**: HTML5, CSS3 (glassmorphism), Vanilla JS
- **Environment**: python-dotenv

## 🔒 Security Notes

- Never commit `.env` files or model weights to Git
- Spotify credentials are required for song recommendations
- The model runs locally (no API calls for emotion detection)
- Voice data is processed via Google's Speech API (online)

## 📝 License

MIT License - feel free to use and modify!

## 🙏 Acknowledgments

- [GoEmotions Dataset](https://github.com/google-research/google-research/tree/master/goemotions) by Google Research
- [Hugging Face Transformers](https://huggingface.co/docs/transformers)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api)

---

**Made with ❤️ by Saksham** | ByteKraft
