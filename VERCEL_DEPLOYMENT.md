# Deploying to Vercel 🚀

This guide will help you deploy your Collaborative Code Editor to Vercel.

## Important: Two-Part Architecture

Your application consists of two parts:
1. **Frontend** (Vite + React) - Deploy to Vercel
2. **Backend** (Y.js WebSocket Server) - Deploy separately

## Step 1: Deploy Frontend to Vercel

### Option A: Using Vercel Dashboard (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push
   ```

2. **Go to [Vercel](https://vercel.com/)** and sign in

3. **Import your GitHub repository**

4. **Configure Project Settings:**
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build:frontend`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **Add Environment Variables** in Vercel Dashboard:
   - Click on your project → Settings → Environment Variables
   - Add the following:
     - `VITE_WEBSOCKET_URL` = `YOUR_BACKEND_URL` (e.g., `https://your-backend.railway.app`)
     - `VITE_YJS_URL` = `YOUR_YJS_WEBSOCKET_URL` (e.g., `wss://your-backend.railway.app`)

6. **Deploy!** Click "Deploy" and wait for the build to complete.

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# For production
vercel --prod
```

## Step 2: Deploy Backend (Y.js Server)

You have several options for deploying your Node.js backend:

### Option A: Railway (Recommended, Simplest)

1. Go to [Railway.app](https://railway.app/)
2. Click "Start a New Project"
3. Connect your GitHub repository
4. Railway will auto-detect your Node.js app
5. Add environment variables:
   - `PORT=4000`
   - `YJS_PORT=1234`
   - `MONGODB_URI=your_mongodb_connection_string`
6. Deploy!

Railway provides WebSocket support out of the box and will give you URLs like:
- HTTP: `https://your-app.railway.app`
- WebSocket: `wss://your-app.railway.app`

### Option B: Render

1. Go to [Render.com](https://render.com/)
2. Create a new "Web Service"
3. Connect your repository
4. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:yjs`
   - **Environment**: Node
5. Add environment variables (same as Railway)
6. Deploy!

### Option C: DigitalOcean App Platform / AWS / Google Cloud

Follow their respective Node.js deployment guides.

## Step 3: Update Frontend Environment Variables

After deploying your backend, update the Vercel environment variables:

1. Go to Vercel Dashboard → Your Project → Settings →  Environment Variables
2. Update:
   - `VITE_WEBSOCKET_URL` = `https://your-backend-url.com`  
   - `VITE_YJS_URL` = `wss://your-backend-url.com`
3. **Redeploy** your frontend

## Step 4: Test Your Deployment

1. Visit your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Create a room and test collaboration features
3. Open the browser console to check for connection errors

## Troubleshooting

### 404 NOT_FOUND Error

**Cause**: Vercel can't find the built files.

**Solution**:
- Ensure `vercel.json` exists with correct configuration
- Verify build command is `npm run build:frontend`
- Check output directory is `dist`
- Review build logs in Vercel Dashboard

### WebSocket Connection Failed

**Cause**: Backend not deployed or environment variables incorrect.

**Solution**:
- Verify backend is running (visit the health endpoint)
- Check environment variables in Vercel:
  - `VITE_WEBSOCKET_URL` should be your backend HTTP URL
  - `VITE_YJS_URL` should be your backend WebSocket URL (wss://)
- Ensure your backend supports WebSocket connections

### MongoDB Connection Error

**Cause**: MongoDB not configured or connection string invalid.

**Solution**:
- Set up MongoDB Atlas (free tier): https://www.mongodb.com/cloud/atlas
- Add connection string to backend environment variables
- Whitelist all IPs (0.0.0.0/0) in MongoDB Atlas Network Access

### Build Fails

**Cause**: Missing dependencies or build errors.

**Solution**:
- Run `npm run build:frontend` locally to test
- Check Node version compatibility (use Node 18+)
- Review build logs for specific errors

## Local Development

For local development, create a `.env` file:

```env
VITE_WEBSOCKET_URL=http://localhost:4000
VITE_YJS_URL=ws://localhost:1234
```

Then run both servers:
```bash
# Terminal 1: Frontend
npm run dev:frontend

# Terminal 2: Y.js Server  
npm run dev:yjs
```

## Production Checklist

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed (Railway/Render/etc.)
- [ ] MongoDB set up and connected
- [ ] Environment variables configured in Vercel
- [ ] WebSocket connections working
- [ ] Tested collaboration features
- [ ] Custom domain configured (optional)

## Need Help?

- Check Vercel deployment logs
- Review browser console for errors
- Test backend health endpoint: `https://your-backend.com/health`
- Ensure CORS is properly configured on backend

## Next Steps

1. **Custom Domain**: Add your custom domain in Vercel Settings
2. **Monitoring**: Set up error tracking (e.g., Sentry)
3. **Analytics**: Add analytics (e.g., Google Analytics, Plausible)
4. **Performance**: Enable Vercel Analytics for performance insights

Happy deploying! 🎉
