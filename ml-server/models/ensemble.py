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
        
        self.num_classes = 3 # 0: Human, 1: AI, 2: Mixed
        
        # Neural Fusion layer
        self.classifier = nn.Sequential(
            nn.Linear(hidden_size + num_advanced_features, 128),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(128, self.num_classes) 
        )
        
    def extract_fusion_features(self, input_ids, attention_mask, raw_texts):
        """Returns the raw concatenated features for LightGBM/Logistic Regression stacking."""
        outputs = self.transformer(input_ids=input_ids, attention_mask=attention_mask)
        pooled_output = outputs.last_hidden_state[:, 0]
        adv_features = self.feature_extractor.extract(raw_texts).to(pooled_output.device)
        return torch.cat((pooled_output, adv_features), dim=1)

    def forward(self, input_ids, attention_mask, raw_texts):
        combined_features = self.extract_fusion_features(input_ids, attention_mask, raw_texts)
        logits = self.classifier(combined_features)
        return logits
