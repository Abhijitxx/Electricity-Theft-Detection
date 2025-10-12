# Render Deployment Guide

## Quick Deploy Commands

### Backend Service (Python FastAPI)
**Build Command:**
```bash
pip install -r backend/requirements.txt
```

**Start Command:**
```bash
cd backend && uvicorn app:app --host 0.0.0.0 --port $PORT
```

**Environment Variables:**
- `PYTHON_VERSION`: `3.11.0`
- `TF_CPP_MIN_LOG_LEVEL`: `2`

---

### Frontend Service (Next.js)
**Build Command:**
```bash
cd frontend && npm install && npm run build
```

**Start Command:**
```bash
cd frontend && npm start
```

**Environment Variables:**
- `NODE_VERSION`: `18.17.0`
- `PYTHON_API_URL`: `https://your-backend-service.onrender.com`
- `PORT`: `3000` (Render sets this automatically)

---

## Deployment Steps

### Option 1: Using Render Blueprint (render.yaml)

1. **Connect Repository:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository: `Abhijitxx/Electricity-Theft-Detection`

2. **Configure Blueprint:**
   - Render will automatically detect `render.yaml`
   - Review services (backend + frontend)
   - Click "Apply"

3. **Deploy:**
   - Render will deploy both services automatically
   - Backend will be available at: `https://theft-detection-backend.onrender.com`
   - Frontend will be available at: `https://theft-detection-frontend.onrender.com`

---

### Option 2: Manual Service Creation

#### Deploy Backend:

1. **New Web Service:**
   - Go to Render Dashboard → "New" → "Web Service"
   - Connect repository: `Abhijitxx/Electricity-Theft-Detection`
   - Root Directory: `./` (or leave blank)

2. **Settings:**
   - **Name:** `theft-detection-backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `cd backend && uvicorn app:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Free (or paid)

3. **Environment:**
   - Add: `PYTHON_VERSION=3.11.0`
   - Add: `TF_CPP_MIN_LOG_LEVEL=2`

4. **Deploy:** Click "Create Web Service"

#### Deploy Frontend:

1. **New Web Service:**
   - Go to Render Dashboard → "New" → "Web Service"
   - Connect repository: `Abhijitxx/Electricity-Theft-Detection`

2. **Settings:**
   - **Name:** `theft-detection-frontend`
   - **Runtime:** `Node`
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Start Command:** `cd frontend && npm start`
   - **Plan:** Free (or paid)

3. **Environment:**
   - Add: `NODE_VERSION=18.17.0`
   - Add: `PYTHON_API_URL=https://theft-detection-backend.onrender.com`

4. **Deploy:** Click "Create Web Service"

---

## Important Notes

### 1. Model Files
Your trained models are stored in the repository:
- `models/autoencoder.h5` (5.4 MB)
- `models/best_lstm.h5` (7.8 MB)
- `models/xgboost_model.joblib`
- `models/randomforest_model.joblib`
- `models/isolationforest_model.joblib`

⚠️ **Warning:** Render's free tier has a slug size limit. If models are too large, consider:
- Using Git LFS (Large File Storage)
- Storing models in cloud storage (AWS S3, Google Cloud Storage)
- Using Render Disk for persistent storage

### 2. Startup Time
- Backend with TensorFlow may take 30-60 seconds to start
- Set health check timeout to at least 60 seconds

### 3. Free Tier Limitations
- Services sleep after 15 minutes of inactivity
- First request after sleep may take 30-60 seconds (cold start)
- Consider upgrading to paid plan for production

### 4. CORS Configuration
The backend already includes CORS middleware for all origins. No additional configuration needed.

---

## Post-Deployment

### Test Backend:
```bash
curl https://theft-detection-backend.onrender.com/
```

### Test Frontend:
Visit: `https://theft-detection-frontend.onrender.com`

### Test Prediction API:
```bash
curl -X POST https://theft-detection-backend.onrender.com/predict \
  -F "file=@sample_data/1_normal_consumption.csv"
```

---

## Troubleshooting

### Build Fails:
- Check build logs in Render dashboard
- Verify all dependencies are in `requirements.txt` and `package.json`
- Ensure Python version is 3.11+

### Service Won't Start:
- Check start command is correct
- Verify environment variables are set
- Check health check endpoint

### Models Not Loading:
- Verify model files exist in repository
- Check file paths in `backend/app.py`
- Consider using absolute paths

---

## Alternative: Deploy with Docker

If you prefer Docker deployment, create these files:

**backend/Dockerfile:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

**frontend/Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

Then deploy as Docker containers on Render.

---

## Support

For deployment issues:
- Check Render Documentation: https://render.com/docs
- Contact Render Support: https://render.com/support
- GitHub Issues: https://github.com/Abhijitxx/Electricity-Theft-Detection/issues
