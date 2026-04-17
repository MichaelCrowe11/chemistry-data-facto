# ✨ Welcome to Your Spark Template!
You've just launched your brand-new Spark Template Codespace — everything’s fired up and ready for you to explore, build, and create with Spark!

This template is your blank canvas. It comes with a minimal setup to help you get started quickly with Spark development.

🚀 What's Inside?
- A clean, minimal Spark environment
- Pre-configured for local development
- Ready to scale with your ideas
  
🧠 What Can You Do?

Right now, this is just a starting point — the perfect place to begin building and testing your Spark applications.

🧹 Just Exploring?
No problem! If you were just checking things out and don’t need to keep this code:

- Simply delete your Spark.
- Everything will be cleaned up — no traces left behind.

📄 License For Spark Template Resources 

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.

---

## Deploy to Railway (Frontend + Backend)

This repo supports deploying the backend API and the frontend UI as two Railway services.

### CLI setup (recommended)

Run the included script from your machine:

- `./railway-deploy.sh`

### Backend service

- Service root directory: `backend`
- Build: uses `backend/Dockerfile`
- Verify: `GET /health` and `GET /api/v1/stats`

### Frontend service

- Service root directory: repo root
- Build: uses `Dockerfile`
- Required service variable: `VITE_API_URL=https://<backend-service>.up.railway.app/api/v1`

The container generates `/env.js` at startup so the frontend can read `VITE_API_URL` at runtime.
