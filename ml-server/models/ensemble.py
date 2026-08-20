import torch
import torch.nn as nn
from transformers import AutoModel

class StylometricExtractor:
    """
    Extracts basic stylometric features for the ensemble.
    """
    def __init__(self):
        pass
        
    def extract(self, texts):
        features = []
        for text in texts:
            words = text.split()
            word_count = len(words)
            if word_count == 0:
                features.append([0.0, 0.0])
                continue
                
            avg_word_length = sum(len(w) for w in words) / word_count
            sentences = [s for s in text.split('.') if len(s.strip()) > 0]
            avg_sentence_length = word_count / max(1, len(sentences))
            
            # Simple 2D stylometric feature vector for baseline
            features.append([avg_word_length, avg_sentence_length])
            
        return torch.tensor(features, dtype=torch.float)

class DetectorEnsemble(nn.Module):
    def __init__(self, transformer_name="distilbert-base-uncased", num_stylometric_features=2):
        super(DetectorEnsemble, self).__init__()
        self.transformer = AutoModel.from_pretrained(transformer_name)
        
        # Determine hidden size
        hidden_size = self.transformer.config.hidden_size
        
        self.stylometric = StylometricExtractor()
        
        # Fusion layer
        self.classifier = nn.Sequential(
            nn.Linear(hidden_size + num_stylometric_features, 128),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(128, 2) # Binary classification: Human (0), AI (1)
        )
        
    def forward(self, input_ids, attention_mask, raw_texts):
        # 1. Transformer features (CLS token)
        outputs = self.transformer(input_ids=input_ids, attention_mask=attention_mask)
        pooled_output = outputs.last_hidden_state[:, 0] # Take CLS token
        
        # 2. Stylometric features
        stylo_features = self.stylometric.extract(raw_texts).to(pooled_output.device)
        
        # 3. Fusion
        combined_features = torch.cat((pooled_output, stylo_features), dim=1)
        
        # 4. Classification
        logits = self.classifier(combined_features)
        return logits
