import torch
import torch.nn as nn
from transformers import AutoModel

from .feature_extractors import AdvancedFeatureExtractor

class DetectorEnsemble(nn.Module):
    def __init__(self, transformer_name="distilbert-base-uncased"):
        super(DetectorEnsemble, self).__init__()
        self.transformer = AutoModel.from_pretrained(transformer_name)
        
        # Determine hidden size
        hidden_size = self.transformer.config.hidden_size
        
        self.feature_extractor = AdvancedFeatureExtractor()
        num_advanced_features = self.feature_extractor.get_num_features()
        
        # Fusion layer
        self.classifier = nn.Sequential(
            nn.Linear(hidden_size + num_advanced_features, 128),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(128, 2) # Binary classification: Human (0), AI (1)
        )
        
    def forward(self, input_ids, attention_mask, raw_texts):
        # 1. Transformer features (CLS token)
        outputs = self.transformer(input_ids=input_ids, attention_mask=attention_mask)
        pooled_output = outputs.last_hidden_state[:, 0] # Take CLS token
        
        # 2. Advanced features
        adv_features = self.feature_extractor.extract(raw_texts).to(pooled_output.device)
        
        # 3. Fusion
        combined_features = torch.cat((pooled_output, adv_features), dim=1)
        
        # 4. Classification
        logits = self.classifier(combined_features)
        return logits
