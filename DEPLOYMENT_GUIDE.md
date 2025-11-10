# 🚀 Deployment Guide

This guide covers deployment to both **Vercel** (recommended for this SPA) and **Fly.io** (alternative option).

## Which Platform to Choose?

### Vercel (Recommended) ⭐
- **Best for**: Static SPAs, React/Vite apps
- **Pros**: Zero-config, global CDN, faster builds, generous free tier
- **Use when**: You want simplest deployment and best performance for static sites

### Fly.io (Alternative)
- **Best for**: Docker-based apps, custom server config
- **Pros**: Full control, can add backend services later
- **Use when**: You need nginx customization or plan to add server-side logic

---

# Option 1: Vercel Deployment (Recommended)

## Prerequisites

1. **Vercel account**: Sign up at https://vercel.com
2. **GitHub/GitLab/Bitbucket**: Your code in a Git repository

## Quick Deploy (Recommended Method)

### Method A: Via Vercel Dashboard (Easiest)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com/new
   - Click "Import Project"
   - Select your repository
   - Vercel auto-detects Vite configuration
   - Click "Deploy"

3. **Configure Environment Variables** (in Vercel Dashboard)
   - Go to Project Settings → Environment Variables
   - Add these variables:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
     - `VITE_AI_API_KEY`: Your AI API key (if using)
   - Optional feature flags:
     - `VITE_ENABLE_3D`: Set to `false` to disable 3D features
     - `VITE_ENABLE_3D_BG`: Set to `false` to disable 3D background
     - `VITE_ENABLE_3D_WELCOME`: Set to `false` to disable 3D welcome
     - `VITE_ENABLE_3D_TRANSITIONS`: Set to `false` to disable 3D transitions

4. **Redeploy** (if you added env vars after first deploy)
   - Go to Deployments tab
   - Click "..." on latest deployment → Redeploy

### Method B: Via Vercel CLI

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy (follow prompts)
vercel

# 4. Deploy to production
vercel --prod
```

## Configuration Files

Your project already includes:
- `vercel.json`: Build settings, SPA routing, security headers, caching
- `.vercelignore`: Files to exclude from deployment

## Custom Domain

1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as shown
4. Wait for SSL certificate (automatic)

## Monitoring & Logs

```bash
# View logs
vercel logs [deployment-url]

# View build logs
vercel logs --follow
```

## Performance Optimization

Vercel automatically provides:
- Global CDN (150+ edge locations)
- Automatic compression (Brotli/gzip)
- Image optimization
- Smart caching

## CI/CD

Vercel automatically:
- Deploys on every push to `main`
- Creates preview deployments for PRs
- Runs build checks

To disable auto-deploy:
- Project Settings → Git → Disable "Automatic Deployments"

## Rollback

1. Go to Deployments tab
2. Find previous successful deployment
3. Click "..." → Promote to Production

## Cost

**Free Tier includes:**
- Unlimited deployments
- 100 GB bandwidth/month
- Automatic SSL
- Preview deployments

**Hobby Plan**: Free for personal projects
**Pro Plan**: $20/month (team collaboration, analytics)

---

# Option 2: Fly.io Deployment

## Prerequisites

1. **Fly.io CLI installed**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Fly.io account**
   - Sign up at https://fly.io/
   - Authenticate: `fly auth login`

## Deployment Steps

### Option 1: Quick Deploy (First Time)

```bash
# 1. Navigate to project directory
cd /workspaces/chemistry-data-facto

# 2. Launch the app (creates + deploys)
fly launch

# Follow the prompts:
# - App name: crowe-code (or your preferred name)
# - Region: Choose closest to your users
# - PostgreSQL: No (we're using Supabase)
# - Redis: No
# - Deploy: Yes
```

### Option 2: Deploy to Existing App

```bash
# 1. Set your app name (if different from fly.toml)
fly apps list  # See your existing apps

# 2. Deploy the update
fly deploy

# 3. Open your app
fly open
```

## Configuration

### Environment Variables (Optional)

Set these in Fly.io if you want to control 3D features:

```bash
# Disable 3D graphics entirely (emergency fallback)
fly secrets set VITE_ENABLE_3D=false

# Disable just the background
fly secrets set VITE_ENABLE_3D_BG=false

# Disable 3D welcome screen
fly secrets set VITE_ENABLE_3D_WELCOME=false

# Disable 3D transitions
fly secrets set VITE_ENABLE_3D_TRANSITIONS=false
```

By default, all features are **enabled** with automatic device detection.

### Scaling

```bash
# Check current status
fly status

# Scale to multiple regions (optional)
fly regions add lax  # Los Angeles
fly regions add fra  # Frankfurt

# Scale memory if needed
fly scale memory 2048  # 2GB
```

## Monitoring

### View Logs
```bash
# Real-time logs
fly logs

# Follow logs
fly logs -f
```

### Check App Status
```bash
fly status
fly checks
```

### View Metrics
```bash
# Open monitoring dashboard
fly dashboard
```

## Troubleshooting

### Build Fails

**Issue**: Out of memory during build
```bash
# Increase builder memory temporarily
fly deploy --build-arg NODE_OPTIONS="--max-old-space-size=4096"
```

**Issue**: Missing dependencies
```bash
# Clear build cache
fly deploy --no-cache
```

### Performance Issues

**Issue**: Slow load times
1. Check if gzip is working: `curl -I https://your-app.fly.dev`
2. Verify CDN is serving static assets
3. Check bundle size: `npm run build` and review output

**Issue**: Users report lag with 3D graphics
1. They can adjust settings via ⚙️ icon in app
2. Or disable via environment variable (see above)

### Deployment Fails

**Issue**: "app not found"
```bash
# Create the app first
fly apps create crowe-code
fly deploy
```

**Issue**: "could not find a Dockerfile"
```bash
# Ensure you're in the project directory
pwd  # Should show /workspaces/chemistry-data-facto
ls Dockerfile  # Should exist
```

## Rollback

If you need to rollback:

```bash
# List recent releases
fly releases

# Rollback to specific version
fly releases rollback v2  # Replace v2 with your version
```

## Custom Domain (Optional)

```bash
# Add your domain
fly certs add your-domain.com

# Add DNS records (shown in output)
# Then verify
fly certs show your-domain.com
```

## CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Fly.io

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Flyctl
        uses: superfly/flyctl-actions/setup-flyctl@master

      - name: Deploy to Fly.io
        run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

Then add your Fly.io API token to GitHub:
1. Get token: `fly auth token`
2. GitHub repo → Settings → Secrets → New secret
3. Name: `FLY_API_TOKEN`
4. Value: (paste token)

## Performance Optimization

### After Deployment

1. **Enable Auto-sleep** (saves costs)
   ```bash
   fly scale count 1 --max-per-region 1
   ```

2. **Monitor Bundle Size**
   - Current: ~1.3MB (includes Three.js)
   - Target: Keep under 2MB
   - Check: `npm run build` shows size breakdown

3. **CDN Caching**
   - Static assets cached for 1 year (see nginx.conf)
   - Automatically handled by configuration

## Cost Estimation

**Free Tier Limits:**
- 3 shared-cpu-1x VMs with 256MB RAM
- 160GB outbound data transfer

**Recommended for Crowe Code:**
- 1x shared-cpu-1x with 1GB RAM: ~$5/month
- Auto-sleep enabled: Reduces to ~$2-3/month
- Multiple regions: +$5/month per region

## Health Checks

The app includes a health endpoint:
```bash
curl https://your-app.fly.dev/health
# Response: healthy
```

Fly.io automatically monitors this endpoint.

## Post-Deployment Verification

After deploying, test these features:

1. ✅ App loads and shows 3D background
2. ✅ Performance settings accessible via ⚙️ icon
3. ✅ 3D welcome screen displays correctly
4. ✅ No console errors
5. ✅ Mobile responsive
6. ✅ Auto-detection works (check console for "Auto-detected")

## Support

**Fly.io Documentation**: https://fly.io/docs/
**Fly.io Community**: https://community.fly.io/

**App-Specific Issues**:
- Check `3D_FEATURES_GUIDE.md` for 3D feature documentation
- Review `IMPLEMENTATION_SUMMARY.md` for architecture details

## Quick Commands Reference

```bash
# Deploy
fly deploy

# View logs
fly logs -f

# Check status
fly status

# Open app
fly open

# SSH into container
fly ssh console

# Restart app
fly apps restart crowe-code

# Scale resources
fly scale memory 2048
fly scale count 2

# Set secrets
fly secrets set KEY=value

# List secrets
fly secrets list
```

## Emergency Procedures

### Disable 3D Graphics Immediately

If users report issues:

```bash
# Disable all 3D features
fly secrets set VITE_ENABLE_3D=false

# Redeploy
fly deploy

# Or rollback to previous version
fly releases rollback
```

### Complete Shutdown

```bash
# Suspend the app
fly apps suspend crowe-code

# Resume when ready
fly apps resume crowe-code
```

---

## Ready to Deploy!

Run this now:

```bash
fly deploy
```

Then visit: `https://crowe-code.fly.dev` (or your custom domain)

🎉 Your 3D-enhanced Crowe Code will be live!
