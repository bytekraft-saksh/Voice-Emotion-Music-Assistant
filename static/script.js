// DOM Elements
const speakBtn = document.getElementById('speakBtn');
const resetBtn = document.getElementById('resetBtn');
const statusDiv = document.getElementById('status');
const resultsDiv = document.getElementById('results');
const errorDiv = document.getElementById('error');
const playerSection = document.getElementById('playerSection');
const spotifyPlayer = document.getElementById('spotifyPlayer');
const leftSongs = document.getElementById('leftSongs');
const rightSongs = document.getElementById('rightSongs');
const openSpotifyBtn = document.getElementById('openSpotifyBtn');
const directPlayBtn = document.getElementById('directPlayBtn');

const userText = document.getElementById('userText');
const rawEmotion = document.getElementById('rawEmotion');
const finalEmotion = document.getElementById('finalEmotion');
const confidence = document.getElementById('confidence');

// Global state
let currentSongs = [];
let currentStep = "idle";
let isWakeWordMode = true;
let wakeRecognition = null;
let currentMode = "emotion"; // "emotion" or "play"

// Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let recognitionTimeout = null;

function createRecognition() {
    if (!SpeechRecognition) return null;
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.maxAlternatives = 1;
    return rec;
}

// Text-to-Speech function
function speak(text) {
    window.speechSynthesis.cancel();
    
    speakBtn.classList.add('speaking');
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1;
    
    utterance.onend = () => {
        speakBtn.classList.remove('speaking');
    };
    
    utterance.onerror = () => {
        speakBtn.classList.remove('speaking');
    };
    
    window.speechSynthesis.speak(utterance);
}

// Event Listeners
speakBtn.addEventListener('click', startListening);
resetBtn.addEventListener('click', handleReset);
directPlayBtn.addEventListener('click', toggleMode);

// Helper: extract number from voice (NEW)
function extractNumber(text) {
    text = text.toLowerCase();

    let match = text.match(/\d+/);
    if (match) return parseInt(match[0]);

    const wordToNumber = {
        "one": 1,
        "two": 2,
        "three": 3,
        "four": 4,
        "five": 5,
        "six": 6,
        "seven": 7,
        "eight": 8,
        "nine": 9,
        "ten": 10
    };

    for (let word in wordToNumber) {
        if (text.includes(word)) {
            return wordToNumber[word];
        }
    }

    return null;
}

// Functions
function showStatus(message) {
    statusDiv.textContent = message;
    statusDiv.classList.remove('hidden');
}

function hideStatus() {
    statusDiv.classList.add('hidden');
}

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    setTimeout(() => errorDiv.classList.add('hidden'), 5000);
}

function hideError() {
    errorDiv.classList.add('hidden');
}

function resetUI() {
    resultsDiv.classList.add('hidden');
    playerSection.classList.add('hidden');
    spotifyPlayer.src = '';
    hideError();
    leftSongs.innerHTML = '';
    rightSongs.innerHTML = '';
    currentSongs = [];
    resetBtn.classList.add('hidden');
    speakBtn.classList.remove('hidden');
}

// Helper: Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Spotify Embed Player Helpers
function getEmbedUrl(spotifyUrl) {
    if (!spotifyUrl) return null;

    // Convert:
    // https://open.spotify.com/track/ID
    // → https://open.spotify.com/embed/track/ID
    return spotifyUrl.replace('/track/', '/embed/track/');
}

function playEmbeddedSong(song) {
    const embedUrl = getEmbedUrl(song.url);

    if (!embedUrl) {
        showError('No playable Spotify link.');
        return;
    }

    spotifyPlayer.src = embedUrl;
    playerSection.classList.remove('hidden');
    updateSpotifyButton(song);

    // Scroll to player
    setTimeout(() => {
        playerSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

function updateSpotifyButton(song) {
    openSpotifyBtn.onclick = () => {
        if (song.url) {
            window.open(song.url, '_blank');
        }
    };
}

function handleReset() {
    // Exit play mode and return to emotion mode
    if (currentMode === "play") {
        currentMode = "emotion";
        document.body.classList.remove('play-mode');
        directPlayBtn.classList.remove('active');
        directPlayBtn.textContent = "Direct Play Mode";
    }
    resetUI();
    currentStep = "emotion";
    setTimeout(() => {
        speak("Back to mood detection. Tell me how you feel.");
    }, 300);
}

// Toggle between Emotion Mode and Direct Play Mode
function toggleMode() {
    if (currentMode === "emotion") {
        // Switch to Play Mode
        currentMode = "play";
        document.body.classList.add('play-mode');
        directPlayBtn.classList.add('active');
        directPlayBtn.textContent = "Emotion Mode";

        // Reset UI
        resultsDiv.classList.add('hidden');
        leftSongs.innerHTML = '';
        rightSongs.innerHTML = '';
        currentSongs = [];
        hideError();

        speak("Direct play mode activated. Which song do you want me to play?");
    } else {
        // Switch back to Emotion Mode
        currentMode = "emotion";
        currentStep = "emotion";
        currentSongs = [];

        document.body.classList.remove('play-mode');
        directPlayBtn.classList.remove('active');
        directPlayBtn.textContent = "Direct Play Mode";

        // Reset UI completely
        resetUI();
        updateMicLabel("Tap to speak");

        speak("Back to mood detection. Tell me how you feel.");
    }
}

// Extract song name from "play <song>" command
function extractSongQuery(text) {
    text = text.toLowerCase().trim();

    // Remove "play" prefix
    if (text.startsWith('play ')) {
        return text.substring(5).trim();
    }

    // Also handle variations
    const prefixes = ['play the song ', 'play song ', 'play track ', 'play '];
    for (const prefix of prefixes) {
        if (text.startsWith(prefix)) {
            return text.substring(prefix.length).trim();
        }
    }

    // If no prefix found, return the whole text
    return text;
}

// Play song by query (Direct Play Mode)
async function playSongByQuery(query) {
    showStatus('🔍 Searching for song...');

    try {
        const response = await fetch(`/play-song?query=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.error) {
            hideStatus();
            showError('Song not found. Please try another.');
            speak("I couldn't find that song. Please try another.");
            return;
        }

        // Display the song in player
        spotifyPlayer.src = data.embed_url || getEmbedUrl(data.url);
        playerSection.classList.remove('hidden');
        updateSpotifyButton(data);

        hideStatus();
        speak(`Playing ${data.song}`);

        // Scroll to player
        setTimeout(() => {
            playerSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);

    } catch (error) {
        hideStatus();
        showError('Error searching for song');
        speak("Sorry, I had trouble finding that song.");
    }
}

function startListening() {
    if (!SpeechRecognition) {
        showError('Speech recognition is not supported in your browser.');
        return;
    }

    // Stop wake word listener to prevent conflict
    if (wakeRecognition) {
        try {
            wakeRecognition.stop();
            wakeRecognition = null;
        } catch (e) {
            // Ignore errors if already stopped
        }
    }
    isWakeWordMode = false;

    // Create fresh recognition instance (fixes reliability issues)
    recognition = createRecognition();
    if (!recognition) {
        showError('Failed to create speech recognition.');
        return;
    }

    showStatus('🎤 Listening...');
    speakBtn.disabled = true;
    speakBtn.classList.add('listening');
    updateMicLabel('Listening...');

    // Safety timeout - auto-stop after 10 seconds
    recognitionTimeout = setTimeout(() => {
        if (recognition) {
            recognition.stop();
        }
    }, 10000);

    let shouldRestartWakeWord = true;

    recognition.onresult = (event) => {
        clearTimeout(recognitionTimeout);
        shouldRestartWakeWord = false; // Don't restart - we got a result
        const transcript = event.results[0][0].transcript;
        console.log('🎤 Voice captured:', transcript);
        console.log('📊 Current mode:', currentMode, '| Current step:', currentStep);

        hideStatus();
        speakBtn.disabled = false;
        speakBtn.classList.remove('listening');
        updateMicLabel('Tap to speak');

        if (currentMode === "play") {
            const query = extractSongQuery(transcript);
            if (query) {
                playSongByQuery(query);
            } else {
                showError("Please say 'play' followed by the song name");
                speak("Please say play followed by the song name.");
            }
        } else if (currentStep === "song_selection") {
            handleSongSelection(transcript);
        } else {
            processText(transcript);
        }
    };

    recognition.onerror = (event) => {
        clearTimeout(recognitionTimeout);
        console.error('🎤 Speech recognition error:', event.error);
        handleSpeechError(event);
    };

    recognition.onend = () => {
        clearTimeout(recognitionTimeout);
        speakBtn.disabled = false;
        speakBtn.classList.remove('listening');
        updateMicLabel('Tap to speak');
        recognition = null;

        // Restart wake word listening after manual session ends (unless we got a result)
        if (shouldRestartWakeWord && !isWakeWordMode) {
            isWakeWordMode = true;
            setTimeout(startWakeWordListening, 500);
        }
    };

    try {
        recognition.start();
    } catch (e) {
        console.error('Failed to start recognition:', e);
        clearTimeout(recognitionTimeout);
        showError('Microphone error. Please try again.');
        speakBtn.disabled = false;
        speakBtn.classList.remove('listening');
    }
}

function updateMicLabel(text) {
    const label = document.querySelector('.mic-label');
    if (label) label.textContent = text;
}

function handleSpeechError(event) {
    hideStatus();
    speakBtn.disabled = false;
    speakBtn.classList.remove('listening');
    updateMicLabel('Tap to speak');

    const errorMessages = {
        'no-speech': 'No speech detected. Please try speaking louder.',
        'audio-capture': 'Microphone not found. Check your mic settings.',
        'not-allowed': 'Microphone permission denied. Allow mic access.',
        'network': 'Network error. Check your internet connection.',
        'aborted': 'Listening cancelled.',
        'service-not-allowed': 'Speech service unavailable.',
        'bad-grammar': 'Recognition error. Please try again.',
        'language-not-supported': 'Language not supported.',
        'permission-denied': 'Permission denied. Check browser settings.'
    };

    const message = errorMessages[event.error] || `Speech error: ${event.error}`;
    console.error('Speech error details:', event.error);
    showError(message);
}

async function processText(text) {
    showStatus('🧠 Analyzing emotion...');
    console.log('📤 Sending to /analyze:', text);

    try {
        const analyzeResponse = await fetch('/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });

        const analyzeData = await analyzeResponse.json();
        console.log('📥 Response from /analyze:', analyzeData);

        displayEmotion(analyzeData, text);

        const finalEmotion = analyzeData.emotion?.final_emotion || 'calm';
        await fetchSongs(finalEmotion);

        currentStep = "song_selection";

        speak("I understand your mood. Here are some songs for you.");
        setTimeout(() => {
            speak("Which song would you like to play?");
        }, 1500);

    } catch (error) {
        console.error('❌ Error in processText:', error);
        hideStatus();
        showError('Error: ' + error.message);
    }
}

function displayEmotion(data, text) {
    const emotion = data.emotion || {};

    userText.textContent = text;
    rawEmotion.textContent = emotion.raw_emotion || 'N/A';
    finalEmotion.textContent = emotion.final_emotion || 'N/A';
    
    const confValue = emotion.confidence;
    confidence.textContent = confValue ? (confValue * 100).toFixed(1) + '%' : 'N/A';

    resultsDiv.classList.remove('hidden');
    hideStatus();
}

async function fetchSongs(emotion) {
    showStatus('🎵 Fetching songs...');

    try {
        const response = await fetch(`/songs?emotion=${encodeURIComponent(emotion)}`);
        const data = await response.json();
        const songs = data.songs;

        if (!songs || songs.length === 0) {
            showError('No songs found.');
            return;
        }

        displaySongs(songs);

    } catch (error) {
        showError('Error fetching songs');
    }
}

function displaySongs(songs) {
    const left = document.getElementById('leftSongs');
    const right = document.getElementById('rightSongs');

    left.innerHTML = '';
    right.innerHTML = '';
    currentSongs = songs;

    songs.forEach((song, index) => {
        const item = document.createElement('div');
        item.className = 'song-item';

        item.innerHTML = `
            <div class="song-number">${index + 1}</div>
            <div class="song-info">
                <div class="song-name">${escapeHtml(song.song)}</div>
                <div class="song-artist">${escapeHtml(song.artist)}</div>
            </div>
        `;

        item.addEventListener('click', () => {
            playEmbeddedSong(song);
            speak('Now playing ' + song.song);
            setTimeout(() => {
                speak('You can say play another song or tell me your mood again');
            }, 2000);
        });

        if (index < 5) {
            left.appendChild(item);
        } else {
            right.appendChild(item);
        }
    });

    resetBtn.classList.remove('hidden');
    hideStatus();
}

// UPDATED FUNCTION (FIXED)
function handleSongSelection(text) {
    const number = extractNumber(text);

    if (number === null) {
        speak("I didn't catch the number. Please try again.");
        return;
    }

    const index = number - 1;

    if (index >= 0 && index < currentSongs.length) {
        const song = currentSongs[index];
        speak(`Playing ${song.song}`);
        playEmbeddedSong(song);
        setTimeout(() => {
            speak('You can say play another song or tell me your mood again');
        }, 2000);
    } else {
        speak("Invalid selection, please try again");
    }
}

// Wake Word Detection (RESTORED)
function startWakeWordListening() {
    if (!SpeechRecognition) {
        console.log('Speech recognition not supported');
        return;
    }
    
    wakeRecognition = new SpeechRecognition();
    wakeRecognition.continuous = true;
    wakeRecognition.interimResults = false;
    wakeRecognition.lang = 'en-US';
    
    wakeRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();

        if (transcript.includes('hey assistant')) {
            wakeRecognition.stop();
            isWakeWordMode = false;

            if (currentMode === "play") {
                speak("Which song do you want me to play?");
            } else {
                speak("Yes, I'm listening");
            }

            setTimeout(() => {
                startListening();
            }, 500);
        }
    };
    
    wakeRecognition.onerror = (event) => {
        console.log('Wake word error:', event.error);
        if (isWakeWordMode && event.error !== 'not-allowed') {
            setTimeout(startWakeWordListening, 2000);
        }
    };
    
    wakeRecognition.onend = () => {
        if (isWakeWordMode) {
            setTimeout(startWakeWordListening, 500);
        }
    };
    
    try {
        wakeRecognition.start();
    } catch (e) {
        console.log('Wake word listener error:', e);
    }
}

// Start wake word on load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(startWakeWordListening, 1000);
});