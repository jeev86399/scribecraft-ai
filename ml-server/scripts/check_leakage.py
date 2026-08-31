import json

def load_hashes(path):
    hashes = set()
    with open(path, 'r') as f:
        for line in f:
            data = json.loads(line)
            if 'hash' in data:
                hashes.add(data['hash'])
            elif 'id' in data:
                hashes.add(data['id'])
    return hashes

train = load_hashes('datasets/v4/v4_train.jsonl')
val = load_hashes('datasets/v4/v4_val.jsonl')
test = load_hashes('datasets/v4/v4_test.jsonl')

print(f"Train samples: {len(train)}")
print(f"Val samples: {len(val)}")
print(f"Test samples: {len(test)}")
print(f"Train-Val Leakage: {len(train.intersection(val))}")
print(f"Train-Test Leakage: {len(train.intersection(test))}")
print(f"Val-Test Leakage: {len(val.intersection(test))}")
