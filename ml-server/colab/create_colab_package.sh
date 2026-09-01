#!/usr/bin/env bash
# Creates a ZIP package for Google Colab training.

cd "$(dirname "$0")/../.."

OUTPUT_ZIP="ml-server-v4.zip"

echo "Packaging ScribeCraft V4 for Google Colab..."

# Remove old zip if it exists
if [ -f "$OUTPUT_ZIP" ]; then
    rm "$OUTPUT_ZIP"
fi

# Zip everything inside ml-server except excluded items
zip -r "$OUTPUT_ZIP" ml-server/ \
    -x "ml-server/venv311/*" \
    -x "ml-server/venv/*" \
    -x "ml-server/__pycache__/*" \
    -x "*/__pycache__/*" \
    -x "ml-server/models/v4/run_*/*" \
    -x "ml-server/models/v4/best_model.pt" \
    -x "ml-server/models/v4/isotonic_calibrator.pkl" \
    -x "ml-server/ml_server.log" \
    -x "ml-server/checkpoints/*" \
    -x "ml-server/datasets/processed/*" \
    -x "ml-server/datasets/registry/*" \
    -x "ml-server/test_samples/*" \
    -x "*/.DS_Store" \
    -x "*/.env"

echo "Verifying ZIP file integrity..."
unzip -t "$OUTPUT_ZIP" > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ Success! Upload $OUTPUT_ZIP to Google Colab."
else
    echo "❌ ERROR: ZIP file is corrupt or missing files."
    exit 1
fi
