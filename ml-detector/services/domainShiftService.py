import re

def check_domain_shift(text: str) -> (bool, float):
    """
    Checks if the text is out-of-distribution (OOD) compared to typical training data.
    Uses heuristic proxy checks (length, lexical anomaly, heavy domain-specific jargon).
    In a full ML system, this would extract Sentence-BERT embeddings and calculate Mahalanobis distance.
    """
    words = text.split()
    if len(words) < 20:
        return True, 0.9  # Very short text is OOD for document-level classifiers
        
    # Proxy: Extremely long words or unusual characters
    long_words = [w for w in words if len(w) > 15]
    long_word_ratio = len(long_words) / len(words)
    
    # Proxy: Technical symbol density
    symbol_density = len(re.findall(r'[^a-zA-Z0-9\s]', text)) / len(text)
    
    if long_word_ratio > 0.1 or symbol_density > 0.15:
        return True, 0.85
        
    return False, 0.1
