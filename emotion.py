from transformers import pipeline

from transformers import pipeline, AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained("model/")
tokenizer.model_input_names = ["input_ids", "attention_mask"]

classifier = pipeline(
    "text-classification",
    model="model/",
    tokenizer=tokenizer
)

# GoEmotions label list (27 emotions)
GOEMOTIONS_LABELS = [
    "admiration", "amusement", "anger", "annoyance", "approval",
    "caring", "confusion", "curiosity", "desire", "disappointment",
    "disapproval", "disgust", "embarrassment", "excitement", "fear",
    "gratitude", "grief", "joy", "love", "nervousness",
    "optimism", "pride", "realization", "relief", "remorse",
    "sadness", "surprise", "neutral"
]

# Emotion category mapping
EMOTION_CATEGORIES = {
    "happy": ["joy", "amusement", "excitement"],
    "sad": ["sadness", "disappointment", "grief"],
    "angry": ["anger", "annoyance"],
    "anxious": ["fear", "nervousness"],
    "romantic": ["love", "admiration"],
    "calm": []
}



def map_emotion(label):
    """
    Map a raw label to a final emotion category.
    
    Args:
        label (str): The raw emotion label from GoEmotions
        
    Returns:
        str: The final emotion category (happy, sad, angry, anxious, romantic, calm)
    """
    label_lower = label.lower()
    
    for category, emotions in EMOTION_CATEGORIES.items():
        if label_lower in emotions:
            return category
    
    return "calm"  # default fallback


def detect_emotion(text):
    """
    Detect emotion from text input.
    
    Args:
        text (str): The input text to analyze
        
    Returns:
        dict: Dictionary containing raw_emotion, final_emotion, and confidence
    """
    result = classifier(text)[0]
    
    # Extract label index from LABEL_X format
    raw_label = result["label"]
    if raw_label.startswith("LABEL_"):
        label_index = int(raw_label.split("_")[1])
        raw_emotion = GOEMOTIONS_LABELS[label_index]
    else:
        raw_emotion = raw_label
    
    confidence = result["score"]
    final_emotion = map_emotion(raw_emotion)
    
    return {
        "raw_emotion": raw_emotion,
        "final_emotion": final_emotion,
        "confidence": float(confidence)
    }
