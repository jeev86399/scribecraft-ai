from services.modelLoader import get_model_pipeline

def run_inference(text: str, model_id: str) -> float:
    """
    Runs text through the specified pipeline.
    Returns a probability (0.0 to 1.0) of the text being AI-generated.
    """
    pipe = get_model_pipeline(model_id)
    
    # RoBERTa limits to 512 tokens. We'll truncate safely.
    # The pipeline handles this if truncation=True is set or by default depending on the model,
    # but we can pass truncation explicitly.
    results = pipe(text, truncation=True, max_length=512)
    
    # Results usually look like: [{'label': 'ChatGPT', 'score': 0.98}, ...]
    # For Hello-SimpleAI/chatgpt-detector-roberta:
    # Label "ChatGPT" means AI generated. "Human" means human.
    if not results or len(results) == 0:
        return 0.5
        
    result = results[0]
    label = result.get('label', '')
    score = result.get('score', 0.5)
    
    if label.lower() == 'chatgpt' or label.lower() == 'ai' or label.lower() == 'fake':
        return score
    else:
        # If it predicted human, the AI probability is 1 - score
        return 1.0 - score
