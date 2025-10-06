# Colab to Dashboard Integration Guide

This guide shows you how to train models in Google Colab and use them in the local Streamlit dashboard.

## 🔄 Complete Workflow

```
Google Colab (Training) → Download Models → Local Machine (Dashboard)
```

## 📝 Step-by-Step Instructions

### Step 1: Train Models in Google Colab

1. Upload `theft_detection.ipynb` to Google Colab
2. Run all cells to train the models (takes 30-60 minutes)
3. **Run the last cell** (Section 11) to download models

The last cell will:
- ✅ Zip all models, scalers, outputs, and figures
- ✅ Download 4 zip files to your computer:
  - `models.zip` (autoencoder, LSTM, XGBoost, etc.)
  - `scalers.zip` (preprocessing scalers)
  - `outputs.zip` (consumer_risk_scores.csv, evaluation_results.json)
  - `figures.zip` (training plots)

### Step 2: Extract Downloaded Files

1. Locate the downloaded zip files in your browser's download folder
2. Extract ALL zip files to your project directory:
   ```
   d:\predictive_analytics\
   ```
3. Your directory structure should look like:
   ```
   d:\predictive_analytics\
   ├── app.py
   ├── theft_detection.ipynb
   ├── models/
   │   ├── autoencoder.h5
   │   ├── best_lstm.h5
   │   ├── xgboost_model.joblib
   │   └── ...
   ├── scalers/
   │   ├── standard_scaler.joblib
   │   ├── minmax_scaler.joblib
   │   └── lstm_scaler.joblib
   ├── outputs/
   │   ├── consumer_risk_scores.csv
   │   └── evaluation_results.json
   └── figures/
       └── (various .png files)
   ```

### Step 3: Verify Downloads

Run the verification script:

```powershell
python download_models_from_colab.py
```

You should see:
```
✅ All models and files verified successfully!
```

### Step 4: Launch Dashboard

```powershell
streamlit run app.py
```

The dashboard will open at `http://localhost:8501`

### Step 5: Upload Data to Dashboard

In the dashboard sidebar:
1. Click "Browse files"
2. Upload `outputs/consumer_risk_scores.csv` (generated from Colab)
3. Explore the visualizations!

## 🎯 What You Can Do with the Dashboard

### With Risk Scores CSV (`outputs/consumer_risk_scores.csv`):
- ✅ View risk distribution across all consumers
- ✅ See top 15 high-risk consumers
- ✅ Check model contributions (autoencoder, LSTM, rules)
- ✅ View confusion matrix and performance metrics
- ✅ Filter by risk category
- ✅ Download filtered consumer lists

### With Raw Consumption Data (`synthetic_consumption.csv`):
- ✅ View consumption patterns over time
- ✅ Compare hourly patterns for normal vs theft consumers
- ✅ See statistical summaries
- ✅ Export filtered data

## 🔧 Troubleshooting

### Problem: "File not found" errors in dashboard

**Solution**: Make sure you extracted the zip files to the correct directory and ran the verification script.

### Problem: Download doesn't start in Colab

**Solution**: Check if pop-ups are blocked in your browser. Allow pop-ups for colab.research.google.com

### Problem: "ModuleNotFoundError" when running dashboard

**Solution**: Install dependencies:
```powershell
pip install -r requirements.txt
```

### Problem: Models are too large (slow download)

**Solution**: Use Google Drive mounting instead:

Add this to your Colab notebook (before Section 11):
```python
from google.colab import drive
drive.mount('/content/drive')

# Save models to Google Drive
import shutil
shutil.copytree('models', '/content/drive/MyDrive/theft_detection/models')
shutil.copytree('scalers', '/content/drive/MyDrive/theft_detection/scalers')
shutil.copytree('outputs', '/content/drive/MyDrive/theft_detection/outputs')
print("✅ Models saved to Google Drive!")
```

Then on your local machine, sync Google Drive and copy files to your project folder.

## 🚀 Alternative: Use Colab for Dashboard (Advanced)

You can also run the Streamlit dashboard directly in Colab using ngrok:

```python
# In Colab, run:
!pip install streamlit pyngrok

# Upload app.py to Colab
from google.colab import files
files.upload()  # Upload app.py

# Run dashboard with ngrok tunnel
!streamlit run app.py &>/dev/null&
!npx localtunnel --port 8501
```

This will give you a public URL to access your dashboard from anywhere.

## 📊 Example Workflow

### First Time Setup (with training):
1. **Colab**: Run notebook end-to-end (60 min)
2. **Colab**: Run export cell (2 min)
3. **Local**: Extract zip files (1 min)
4. **Local**: Run verification script (10 sec)
5. **Local**: Launch dashboard (10 sec)
6. **Dashboard**: Upload and analyze results

**Total time**: ~65 minutes

### Subsequent Runs (retrain and update):
1. **Colab**: Make changes and rerun notebook
2. **Colab**: Run export cell
3. **Local**: Extract and overwrite files
4. **Dashboard**: Refresh page to see new results

**Total time**: ~2 minutes

## 💡 Pro Tips

1. **Keep Colab session alive**: Use the "Stay awake" extension to prevent disconnection during long training runs

2. **Version your models**: Add timestamps to downloaded files:
   ```python
   # In the export cell, add:
   from datetime import datetime
   timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
   shutil.make_archive(f'models_{timestamp}', 'zip', 'models')
   ```

3. **Compare multiple runs**: Download different model versions and compare results in the dashboard

4. **Use GPU runtime**: In Colab, select Runtime > Change runtime type > GPU for 5-10x faster training

5. **Checkpoint frequently**: Save models after each major section in case of disconnection

## 📞 Need Help?

- Check `DASHBOARD_GUIDE.md` for dashboard-specific help
- Check `README.md` for general project information
- Verify file structure with `python download_models_from_colab.py`

Happy analyzing! 🎉
