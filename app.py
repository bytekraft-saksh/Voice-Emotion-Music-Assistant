from flask import Flask, request, jsonify, render_template
from emotion import detect_emotion
from spotify import get_songs

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/analyze", methods=["POST"])
def analyze():
    # Check if request body exists
    if not request.is_json:
        return jsonify({"error": "Request body must be JSON"}), 400

    data = request.get_json()

    # Check if "text" field is present
    if "text" not in data:
        return jsonify({"error": "Missing 'text' field in request body"}), 400

    text = data["text"]
    emotion_result = detect_emotion(text)

    return jsonify({
        "input_text": text,
        "emotion": emotion_result
    })


@app.route("/songs", methods=["GET"])
def songs():
    # Get emotion from query param (default = calm)
    emotion = request.args.get("emotion", "calm").lower()

    print(f"🎯 Received emotion: {emotion}")  # Debug log

    songs_list = get_songs(emotion)

    # Return in proper JSON format for frontend
    if not songs_list:
        return jsonify({"songs": []})

    return jsonify({"songs": songs_list})


if __name__ == "__main__":
    app.run(debug=True)