import argparse
from pathlib import Path
import json
import requests
import sys

def test_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            text = f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return

    word_count = len(text.split())
    if word_count < 10:
        print(f"File {filepath} skipped: text too short ({word_count} words).")
        return

    print(f"\nEvaluating: {filepath}")
    print(f"Document length: {word_count} words")
    
    try:
        # We ping the local API server
        response = requests.post("http://127.0.0.1:5002/detect", json={
            "text": text,
            "models": ["ensemble_v4"]
        })
        data = response.json()
    except Exception as e:
        print(f"Error connecting to ML server: {e}")
        print("Is the server running? Start it with: cd ml-server && python main.py")
        return

    if data.get("status") != "success":
        print(f"API Error: {data}")
        return

    res = data["results"]["ensemble_v4"]
    
    if not res["available"]:
        print("Model loaded: False")
        print("Fallback active: True (Fallback used: NO FAKE SCORES ALLOWED)")
        print(f"Reason: {res.get('reason')}")
        return

    print(f"Model version: V4")
    print(f"Model loaded: True")
    print(f"Fallback active: False")
    print("-" * 30)
    print(f"Classification:       {res['classification']}")
    print(f"AI likelihood:        {res['ai_probability']}%")
    print(f"Human likelihood:     {res['human_probability']}%")
    print(f"Estimated AI content: {res['estimated_ai_content']}%")
    print(f"Confidence:           {res['confidence']}")
    print(f"Evidence level:       {res['evidence_tier']}")
    print("-" * 30)

def main():
    parser = argparse.ArgumentParser(description="External real-world validation script")
    parser.add_argument("--file", type=str, help="Path to a single text file to evaluate")
    parser.add_argument("--directory", type=str, help="Path to a directory of text files to evaluate")
    args = parser.parse_args()

    if args.file:
        test_file(args.file)
    elif args.directory:
        p = Path(args.directory)
        if not p.is_dir():
            print(f"Directory not found: {args.directory}")
            return
        for file in p.glob("*.txt"):
            test_file(file)
    else:
        print("Please provide either --file or --directory")

if __name__ == "__main__":
    main()
