# 🚀 Deployment Guide for ImgPDF

## Quick Deploy Options

### Option 1: Vercel (Frontend) + Railway (Backend) - RECOMMENDED

#### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/imgpdf.git
git push -u origin main
```

#### Step 2: Deploy Backend to Railway
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repo and choose the `backend` folder
4. Railway will auto-detect Node.js
5. Add environment variable: `PORT=5000`
6. Copy your Railway URL (e.g., `https://imgpdf-backend.up.railway.app`)

#### Step 3: Update Frontend API URL
Before deploying frontend, update the API URL in your frontend code.
Create a `.env` file in the frontend folder:
```
REACT_APP_API_URL=https://your-railway-url.up.railway.app
```

#### Step 4: Deploy Frontend to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project" → Select your GitHub repo
3. Set root directory to `frontend`
4. Add environment variable: `REACT_APP_API_URL=https://your-railway-url.up.railway.app`
5. Click Deploy!

---

### Option 2: Render.com (Both in one place)

1. Go to [render.com](https://render.com)
2. **For Backend:**
   - New → Web Service
   - Connect GitHub repo
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node server.js`
   
3. **For Frontend:**
   - New → Static Site
   - Connect GitHub repo
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `build`

---

### Option 3: Self-Hosting (VPS/Cloud Server)

#### Build for Production
```bash
# Build frontend
cd frontend
npm run build

# The build folder is ready to be served
```

#### Using PM2 (Process Manager)
```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend
pm2 start server.js --name "imgpdf-backend"

# Serve frontend with a static server
npm install -g serve
cd frontend
pm2 start "serve -s build -l 3000" --name "imgpdf-frontend"
```

---

## Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=production
```

### Frontend (.env)
```
REACT_APP_API_URL=https://your-backend-url.com
```

---

## Free Hosting Platforms Comparison

| Platform | Frontend | Backend | Free Tier |
|----------|----------|---------|-----------|
| Vercel | ✅ | ❌ | Unlimited |
| Railway | ❌ | ✅ | $5 credit/month |
| Render | ✅ | ✅ | 750 hrs/month |
| Netlify | ✅ | ❌ | 100GB bandwidth |
| Fly.io | ❌ | ✅ | 3 shared VMs |

---

## Domain Setup

After deploying, you can add a custom domain:
1. Buy a domain from Namecheap, GoDaddy, or Google Domains
2. In Vercel/Render, go to Settings → Domains
3. Add your domain and update DNS records

---

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
