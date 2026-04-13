// DOM Elements
const speakBtn = document.getElementById('speakBtn');
const resetBtn = document.getElementById('resetBtn');
const statusDiv = document.getElementById('status');
const resultsDiv = document.getElementById('results');
const songsSection = document.getElementById('songsSection');
const songList = document.getElementById('songList');
const errorDiv = document.getElementById('error');

const userText = document.getElementById('userText');
const rawEmotion = document.getElementById('rawEmotion');
const finalEmotion = document.getElementById('finalEmotion');
const confidence = document.getElementById('confidence');

// Global state
let currentSongs = [];
let currentStep = "idle";
let isWakeWordMode = true;
let wakeRecognition = null;

// Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
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
    songsSection.classList.add('hidden');
    hideError();
    songList.innerHTML = '';
    currentSongs = [];
    resetBtn.classList.add('hidden');
    speakBtn.classList.remove('hidden');
}

function handleReset() {
    resetUI();
    currentStep = "emotion";
    setTimeout(() => {
        speak("Tell me how you feel");
    }, 300);
}

function startListening() {
    if (!recognition) {
        showError('Speech recognition is not supported in your browser.');
        return;
    }

    showStatus('🎤 Listening...');
    speakBtn.disabled = true;
    speakBtn.classList.add('listening');
    updateMicLabel('Listening...');

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        hideStatus();
        speakBtn.disabled = false;
        speakBtn.classList.remove('listening');
        updateMicLabel('Tap to speak');

        if (currentStep === "song_selection") {
            handleSongSelection(transcript);
        } else {
            processText(transcript);
        }
    };

    recognition.onerror = (event) => {
        speakBtn.classList.remove('listening');
        updateMicLabel('Tap to speak');
        handleSpeechError(event);
    };
    
    recognition.onend = () => {
        speakBtn.disabled = false;
        speakBtn.classList.remove('listening');
        updateMicLabel('Tap to speak');
    };

    recognition.start();
}

function updateMicLabel(text) {
    const label = document.querySelector('.mic-label');
    if (label) label.textContent = text;
}

function handleSpeechError(event) {
    hideStatus();
    speakBtn.disabled = false;
    updateMicLabel('Tap to speak');

    showError('Speech error');
}

async function processText(text) {
    showStatus('🧠 Analyzing emotion...');

    try {
        const analyzeResponse = await fetch('/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });

        const analyzeData = await analyzeResponse.json();

        displayEmotion(analyzeData, text);

        const finalEmotion = analyzeData.emotion?.final_emotion || 'calm';
        await fetchSongs(finalEmotion);

        currentStep = "song_selection";

        speak("I understand your mood. Here are some songs for you.");
        setTimeout(() => {
            speak("Which song would you like to play?");
        }, 1500);

    } catch (error) {
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
    songList.innerHTML = '';
    currentSongs = songs;

    songs.forEach((song, index) => {
        const div = document.createElement('div');
        div.className = 'song-item';
        div.innerHTML = `${index + 1}. ${song.song} - ${song.artist}`;

        div.onclick = () => window.open(song.url, '_blank');
        songList.appendChild(div);
    });

    songsSection.classList.remove('hidden');
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
        if (song.url) {
            window.open(song.url, '_blank');
        }
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

            speak("Yes, I'm listening");

            setTimeout(() => {
                startListening();
            }, 500);
        }
    };
    
    wakeRecognition.onerror = () => {
        if (isWakeWordMode) {
            setTimeout(startWakeWordListening, 1000);
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