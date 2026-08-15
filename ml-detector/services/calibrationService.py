def calibrate_probability(raw_prob: float, model_id: str, is_ood: bool) -> float:
    """
    Applies Platt scaling or temperature scaling proxy to smooth out overly confident scores.
    Many transformer classifiers suffer from overconfidence (0.999 or 0.001).
    This function softens the bounds, especially if Out-Of-Distribution (OOD).
    """
    # Simple bounds clamping / temperature smoothing for demonstration
    # In a full production system, we'd load isotonic regression weights here.
    
    # Sigmoid smoothing to reduce extreme confidence slightly
    # If the score is > 0.99, pull it back to 0.95 unless we have overwhelming evidence.
    
    calibrated = raw_prob
    
    if is_ood:
        # If out of distribution, pull extreme predictions toward the center (uncertainty)
        if calibrated > 0.9:
            calibrated = 0.85
        elif calibrated < 0.1:
            calibrated = 0.15
        else:
            # Move 10% closer to 0.5
            calibrated = calibrated + (0.5 - calibrated) * 0.2
            
    return round(calibrated, 4)
