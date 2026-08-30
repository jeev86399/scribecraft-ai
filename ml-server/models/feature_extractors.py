import re
import math
from collections import Counter
import torch
import nltk
import spacy

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Warning: SpaCy model 'en_core_web_sm' not found. POS features will be disabled.")
    nlp = None

class AdvancedFeatureExtractor:
    """
    Extracts advanced stylometric, statistical, and structural features for AI detection.
    """
    def __init__(self):
        self.feature_names = [
            "avg_word_length",
            "avg_sentence_length",
            "type_token_ratio",
            "word_entropy",
            "char_entropy",
            "comma_ratio",
            "period_ratio",
            "question_ratio",
            "exclamation_ratio",
            "noun_ratio",
            "verb_ratio",
            "adj_ratio",
            "adv_ratio"
        ]

    def _shannon_entropy(self, data):
        if not data:
            return 0.0
        counts = Counter(data)
        total = len(data)
        entropy = -sum((count/total) * math.log2(count/total) for count in counts.values())
        return entropy

    def extract_single(self, text):
        if not text.strip():
            return [0.0] * len(self.feature_names)

        # Basic tokenization
        words = text.split()
        num_words = len(words)
        if num_words == 0:
            return [0.0] * len(self.feature_names)
            
        sentences = [s for s in text.split('.') if len(s.strip()) > 0]
        num_sentences = max(1, len(sentences))

        # Stylometric
        avg_word_length = sum(len(w) for w in words) / num_words
        avg_sentence_length = num_words / num_sentences
        type_token_ratio = len(set([w.lower() for w in words])) / num_words

        # Statistical
        word_entropy = self._shannon_entropy([w.lower() for w in words])
        char_entropy = self._shannon_entropy(text)

        # Structural / Punctuation
        total_chars = max(1, len(text))
        comma_ratio = text.count(',') / total_chars
        period_ratio = text.count('.') / total_chars
        question_ratio = text.count('?') / total_chars
        exclamation_ratio = text.count('!') / total_chars

        # POS Features (SpaCy)
        noun_ratio = 0.0
        verb_ratio = 0.0
        adj_ratio = 0.0
        adv_ratio = 0.0
        
        if nlp is not None and len(text) < 100000: # avoid crashing on huge texts
            doc = nlp(text)
            num_tokens = len(doc)
            if num_tokens > 0:
                pos_counts = Counter([token.pos_ for token in doc])
                noun_ratio = pos_counts.get("NOUN", 0) / num_tokens
                verb_ratio = pos_counts.get("VERB", 0) / num_tokens
                adj_ratio = pos_counts.get("ADJ", 0) / num_tokens
                adv_ratio = pos_counts.get("ADV", 0) / num_tokens

        features = [
            avg_word_length,
            avg_sentence_length,
            type_token_ratio,
            word_entropy,
            char_entropy,
            comma_ratio,
            period_ratio,
            question_ratio,
            exclamation_ratio,
            noun_ratio,
            verb_ratio,
            adj_ratio,
            adv_ratio
        ]
        return features

    def extract(self, texts):
        batch_features = [self.extract_single(t) for t in texts]
        return torch.tensor(batch_features, dtype=torch.float)

    def get_num_features(self):
        return len(self.feature_names)
