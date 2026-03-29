# Deployment Guide — Render (Free Tier)

This project is configured for **full-stack deployment on Render** — the Express backend serves the React frontend's built files as a single Web Service.

---

## Prerequisites

- A **GitHub** account (free)
- A **Render** account (free) — sign up at [render.com](https://render.com) using GitHub
- **Git** installed on your computer
- **Node.js** installed (you already have this)

---

## Step 1: Create a GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Name it something like `imgpdf-toolkit`
3. Keep it **Public** or Private
4. **Do NOT** initialize with README (we already have one)
5. Click **Create repository**

---

## Step 2: Push Your Code to GitHub

Open a terminal **in your project folder** and run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/imgpdf-toolkit.git
git push -u origin main
```

> Replace `YOUR_USERNAME` with your actual GitHub username and `imgpdf-toolkit` with your repo name.

---

## Step 3: Deploy on Render

1. Go to [render.com](https://render.com) and sign in with GitHub
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Find and select your `imgpdf-toolkit` repository
5. Fill in the settings:

| Setting | Value |
|---------|-------|
| **Name** | `imgpdf-toolkit` (or any name you like) |
| **Region** | Choose the closest to you |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm run render:build` |
| **Start Command** | `npm run render:start` |
| **Instance Type** | **Free** |

6. Click **"Create Web Service"**
7. Wait for the build to finish (first build takes a few minutes)
8. Your app is live! Render gives you a URL like `https://imgpdf-toolkit.onrender.com`

---

## Step 4: Verify Deployment

1. Open your Render URL (e.g., `https://imgpdf-toolkit.onrender.com`)
2. Test each feature:
   - Upload and convert an image
   - Compress an image
   - Merge two PDFs
   - Extract PDF pages
   - Convert/rotate a PDF

---

## How It Works

| Component | Local Dev | Render Production |
|-----------|-----------|-------------------|
| Frontend  | `localhost:3000` (React dev server) | Static files from `frontend/build` served by Express |
| Backend   | `localhost:5000` (Express server) | Express server on Render |
| File Storage | `backend/uploads/` & `backend/output/` | Same dirs (persistent within deploy) |
| API URL   | `http://localhost:5000` | Same domain (relative URLs) |

---

## Notes

- **Free tier spin-down**: Render free services spin down after 15 minutes of inactivity. The first request after spin-down takes ~30 seconds to respond.
- **Auto-deploys**: Every push to `main` on GitHub will automatically trigger a new deploy on Render.
- **Environment variables**: If needed, you can add environment variables in the Render dashboard under your service → "Environment".

---

## Free Tier Limitations

| Limit | Value |
|-------|-------|
| Request body size | **4.5 MB** (max upload file size) |
| Function timeout | **10 seconds** per request |
| Deployments | **Unlimited** |
| Bandwidth | **100 GB/month** |
| File storage | **Ephemeral** (`/tmp`, cleared between invocations) |

> Files larger than ~4.5 MB won't upload. Heavy PDF processing may hit the 10-second timeout. For most everyday use, this works fine.

---

## Redeploying After Changes

After editing code locally:

```bash
git add .
git commit -m "Your change description"
git push
```

Vercel **automatically redeploys** when you push to the `main` branch.

---

## Custom Domain (Optional)

1. In Vercel dashboard → your project → **Settings** → **Domains**
2. Add your custom domain (e.g., `imgpdf.yourdomain.com`)
3. Follow the DNS instructions Vercel provides
4. Free SSL is included automatically

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails | Check Vercel build logs; ensure `frontend/package.json` has correct dependencies |
| API returns 500 | Check Vercel function logs (Dashboard → Functions tab) |
| Upload fails | File may exceed 4.5 MB limit on free tier |
| Slow processing | May be hitting the 10-second timeout; try smaller files |
| CORS error | Set `CORS_ORIGIN` env var in Vercel to your deployment URL |

### Viewing Logs
1. Go to Vercel Dashboard → your project
2. Click **"Deployments"** → latest deployment
3. Click **"Functions"** tab to see serverless function logs

---

## Environment Variables (Optional)

You generally **don't need to set any** for basic deployment. But if needed:

| Variable | Where | Purpose |
|----------|-------|---------|
| `CORS_ORIGIN` | Vercel → Settings → Env Vars | Restrict API access to specific domains |
| `REACT_APP_API_URL` | Vercel → Settings → Env Vars | Override API URL (leave empty for same-domain) |

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
