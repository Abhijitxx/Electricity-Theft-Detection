# 🚀 Render Build Commands - Quick Reference

## Backend (Python FastAPI)

### Build Command:
```bash
pip install -r backend/requirements.txt
```

### Start Command:
```bash
cd backend && uvicorn app:app --host 0.0.0.0 --port $PORT
```

### Environment Variables:
```
PYTHON_VERSION=3.11.0
TF_CPP_MIN_LOG_LEVEL=2
```

---

## Frontend (Next.js)

### Build Command:
```bash
cd frontend && npm install && npm run build
```

### Start Command:
```bash
cd frontend && npm start
```

### Environment Variables:
```
NODE_VERSION=18.17.0
PYTHON_API_URL=https://your-backend-url.onrender.com
PORT=3000
```

---

## Full-Stack (Single Service - Not Recommended)

### Build Command:
```bash
pip install -r backend/requirements.txt && cd frontend && npm install && npm run build
```

### Start Command:
```bash
./build.sh
```

---

## Important Files Created:

1. ✅ `render.yaml` - Blueprint for automatic deployment
2. ✅ `build.sh` - Build script for manual builds
3. ✅ `DEPLOYMENT.md` - Complete deployment guide

## Next Steps:

1. Push these files to GitHub:
   ```bash
   git add render.yaml build.sh DEPLOYMENT.md
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. Go to Render Dashboard and create services using the commands above

3. Or use Blueprint deployment by connecting your repo and Render will auto-detect `render.yaml`
