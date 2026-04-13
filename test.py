from emotion import detect_emotion


def main():
    test_inputs = [
        "I feel amazing today!",
        "I am very stressed and tired"
    ]

    for text in test_inputs:
        result = detect_emotion(text)
        print(f"\nInput: {text}")
        print(f"  Raw Emotion: {result['raw_emotion']}")
        print(f"  Final Emotion: {result['final_emotion']}")
        print(f"  Confidence: {result['confidence']:.4f}")


if __name__ == "__main__":
    main()
