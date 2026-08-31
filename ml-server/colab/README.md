# ScribeCraft AI V4 - GPU Training via Google Colab

Because CPU training on 11,000+ texts takes >24 hours, use this package to train the DistilBERT neural ensemble on a free T4 GPU in Google Colab (which should finish in ~15 minutes).

## Reproducibility Steps

### 1. Upload Project to Colab
1. Zip the entire `ml-server` directory.
2. Open Google Colab and create a new notebook.
3. In the menu, go to **Runtime > Change runtime type** and select **T4 GPU**.
4. Upload `ml-server.zip` into the Colab file explorer and unzip it:
   ```bash
   !unzip -q ml-server.zip
   ```

### 2. Install Dependencies
Run the setup script to install PyTorch, Transformers, and Scikit-Learn:
```bash
!bash ml-server/colab/setup_colab.sh
```

### 3. Start Training
Launch the GPU-accelerated training script. This script automatically uses Automatic Mixed Precision (AMP) and Gradient Accumulation to optimize VRAM.
```bash
!python ml-server/colab/train_colab.py
```

### 4. Resume Training (If Interrupted)
If Colab disconnects, simply run step 3 again. The script will automatically detect `models/v4/latest_checkpoint.pt` and resume from the last completed epoch.

### 5 & 6. Download Trained Artifacts
Once training and calibration are complete, download the final artifacts from Colab:
- `ml-server/models/v4/best_model.pt`
- `ml-server/models/v4/isotonic_calibrator.pkl`

### 7. Copy Artifacts into Local ScribeCraft
Place the downloaded files back into your local Mac's `ml-server/models/v4/` directory.

### 8. Start ML Server
Back on your Mac, start the local AI detection API:
```bash
cd ml-server
source venv311/bin/activate
python main.py
```
*(You can verify it loaded the weights by curling `http://127.0.0.1:5002/health` — it should return `"status": "ok"` and list `ensemble_v4`)*.

### 9. Run Final Benchmark
Finally, evaluate the newly trained checkpoint against the untouched **FINAL TEST** set:
```bash
python training/benchmark.py
```
This will automatically generate the exhaustive `FINAL_REPORT.md` (AUPRC, False Positive Rates, Calibration ECE) in `ml-server/output/reports/`.
