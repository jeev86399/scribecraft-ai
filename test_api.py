import requests

try:
    health = requests.get("http://127.0.0.1:5002/health").json()
    print("Health:", health)
    
    payload = {"text": "The quick brown fox jumps over the lazy dog. This is a very predictable sentence."}
    res = requests.post("http://127.0.0.1:5002/detect", json=payload).json()
    print("Detect:", res)
except Exception as e:
    print("Error:", e)
