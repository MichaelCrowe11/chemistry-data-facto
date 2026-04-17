# Crowe Code - Deployment Guide

## Deploy to Vercel with Supabase Authentication

This guide will walk you through deploying Crowe Code to Vercel with Supabase authentication.

### Prerequisites

- Vercel account ([signup here](https://vercel.com/signup))
- Supabase account ([signup here](https://supabase.com))
- OpenAI API key (for Crowe Logic AI features)

### Step 1: Set Up Supabase

1. **Create a new Supabase project**:
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Click "New Project"
   - Fill in your project details
   - Wait for the project to be provisioned

2. **Get your Supabase credentials**:
   - Navigate to Project Settings → API
   - Copy your `Project URL` (VITE_SUPABASE_URL)
   - Copy your `anon/public` key (VITE_SUPABASE_ANON_KEY)

3. **Configure Authentication Providers** (Optional but recommended):
   - Go to Authentication → Providers
   - Enable GitHub and/or Google OAuth
   - Follow the setup instructions for each provider
   - Add your Vercel deployment URL as an authorized redirect URL

### Step 2: Deploy to Vercel

1. **Connect your repository**:
   ```bash
   # Make sure your code is pushed to GitHub
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Import to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite configuration

3. **Configure Environment Variables**:
   Add the following environment variables in Vercel:

   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_AI_API_KEY=your_openai_api_key
   VITE_AI_GATEWAY_URL=https://gateway.ai.cloudflare.com/v1
   ```

4. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete
   - Your Crowe Code instance will be live!

### Step 3: Configure Supabase Redirect URLs

1. Go back to your Supabase project
2. Navigate to Authentication → URL Configuration
3. Add your Vercel deployment URL to:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`

### Step 4: Test Authentication

1. Visit your deployed Crowe Code app
2. Click "Sign In" in the top-right corner
3. Try signing up with email or OAuth providers
4. Verify email confirmation works (check spam folder)

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key | Yes |
| `VITE_AI_API_KEY` | OpenAI API key for Crowe Logic AI | Yes for AI features |
| `VITE_AI_GATEWAY_URL` | AI Gateway URL (default provided) | No |
| `VITE_API_URL` | Chemistry data API URL (if using) | No |

## Deploy Backend API to Railway

This repo includes a FastAPI backend in `backend/` that can be deployed as a Railway service.

### Option A: Deploy the backend (recommended)

1. Create a new Railway project and add a service from this GitHub repo.
2. In the service settings, set the **Root Directory** to `backend`.
3. Railway will detect and build using `backend/Dockerfile`.
4. Add any needed environment variables (all optional unless you use those integrations):

   - `NP_ORCID_CLIENT_ID`
   - `NP_ORCID_CLIENT_SECRET`
   - `NP_ORCID_REDIRECT_URI`
   - `NP_ZENODO_ACCESS_TOKEN`
   - `NP_ZENODO_USE_SANDBOX` (default: true)

   Railway will automatically provide `PORT` and the backend binds to it.

5. Deploy, then verify:
   - `GET /health`
   - `GET /api/v1/stats`

### Option B: Deploy both frontend + backend (two Railway services)

1. Create a new Railway project.

2. Add **Backend** service:
   - Service → Deploy from GitHub
   - **Root Directory**: `backend`
   - Build uses `backend/Dockerfile`
   - Deploy and copy the public URL (you’ll use it for the frontend build arg).

3. Add **Frontend** service:
   - Service → Deploy from GitHub
   - **Root Directory**: repo root
   - Build uses `Dockerfile` + `nginx.conf.template`

4. Configure the frontend to call the backend:
   - Set a **service variable**: `VITE_API_URL=https://<backend-service>.up.railway.app/api/v1`

   The frontend reads this at runtime from `/env.js` (generated at container startup).

5. Deploy, then verify:
   - Frontend `GET /health` returns `healthy`
   - Frontend UI can fetch backend `GET /health` and `GET /api/v1/stats`

### Hooking up the frontend (optional)

If you also deploy the frontend elsewhere (e.g. Vercel) or as a second Railway service, set:

- `VITE_API_URL` to your Railway backend URL (e.g. `https://<service>.up.railway.app/api/v1`).

## Features Enabled

Once deployed with Supabase authentication, users can:

- ✅ Sign up with email/password
- ✅ Sign in with GitHub OAuth
- ✅ Sign in with Google OAuth
- ✅ Persistent sessions across devices
- ✅ Save files and projects to the cloud
- ✅ Access Crowe Logic AI assistant
- ✅ Sync settings across devices

## Troubleshooting

### Build Fails
- Check that all environment variables are set correctly
- Verify `npm run build` works locally
- Check Vercel build logs for specific errors

### Authentication Not Working
- Verify Supabase URL and keys are correct
- Check that redirect URLs are configured in Supabase
- Ensure OAuth providers are enabled and configured

### AI Features Not Working
- Verify `VITE_AI_API_KEY` is set
- Check OpenAI API key has credits
- Review browser console for API errors

## Local Development

To run with Supabase locally:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Supabase credentials in `.env`

3. Start the development server:
   ```bash
   npm run dev
   ```

## Continuous Deployment

Vercel will automatically redeploy your app when you push to your main branch:

```bash
git add .
git commit -m "Update Crowe Code"
git push origin main
```

## Security Notes

- Never commit `.env` files to version control
- Rotate your API keys regularly
- Use Supabase Row Level Security (RLS) policies for data protection
- Enable email confirmation for new signups
- Consider enabling MFA for sensitive applications

## Support

For issues and questions:
- GitHub Issues: `https://github.com/MichaelCrowe11/chemistry-data-facto/issues`
- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs

---

Built with ❤️ by Crowe Code
