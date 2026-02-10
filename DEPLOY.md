# Deploy to Google Cloud Run (Minimum Cost Setup)

This guide deploys your AI Virtual Try-On app to **Google Cloud Run** with:
- **$0 idle cost** (scales to zero when not in use)
- **Pay per request** pricing (~$0.40 per 1M requests)
- **Free tier**: 2M requests/month, 360K GB-seconds/month

---

## Prerequisites

1. **Google Cloud account** with billing enabled
2. **gcloud CLI** installed: https://cloud.google.com/sdk/docs/install

---

## 1. Initial Setup (One-time)

```bash
# Login to gcloud
gcloud auth login

# Set your project ID (replace with your actual project ID)
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com
```

---

## 2. Set Environment Variables

```bash
# Set your region (choose closest to your users)
export REGION=us-central1

# Set service name
export SERVICE_NAME=ai-tryon

# Set your Gemini API key (from Google Cloud Console)
export GOOGLE_API_KEY=your_api_key_here
```

---

## 3. Deploy to Cloud Run

```bash
# Deploy with gcloud (builds and deploys in one command)
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_API_KEY=$GOOGLE_API_KEY \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300
```

**What this does:**
- Builds Docker image from your code
- Pushes to Artifact Registry
- Deploys to Cloud Run
- Sets your API key as environment variable
- Configures minimum resources (512MB RAM, 1 CPU)
- Scales to zero when idle (no cost)
- Max 10 concurrent instances

---

## 4. Get Your URL

After deployment completes, you'll see:

```
Service URL: https://ai-tryon-xxxxx-uc.a.run.app
```

Open that URL in your browser — your app is live!

---

## Cost Breakdown (Minimum Config)

| Resource | Cost | Your Config |
|----------|------|-------------|
| **CPU** | $0.00002400/vCPU-second | 1 vCPU |
| **Memory** | $0.00000250/GB-second | 0.5 GB |
| **Requests** | $0.40/million | Pay per use |
| **Idle cost** | **$0** | Scales to zero |

**Example:** 
- 100 image generations/month (~30s each): **~$0.36/month**
- 1,000 image generations/month: **~$3.60/month**

Plus Gemini API costs (~$0.04/image).

---

## 5. Update Deployment (When You Make Changes)

```bash
# Just run the same deploy command again
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION
```

Cloud Run auto-builds and deploys your changes.

---

## 6. Monitor & Manage

```bash
# View logs
gcloud run services logs read $SERVICE_NAME --region $REGION

# View service info
gcloud run services describe $SERVICE_NAME --region $REGION

# Delete service (stop all charges)
gcloud run services delete $SERVICE_NAME --region $REGION
```

---

## Cost Optimization Tips

1. **Set max-instances low** (10 is safe for personal use)
2. **Memory: 512Mi is enough** (don't overprovision)
3. **Enable authentication** if you don't need public access:
   ```bash
   gcloud run deploy $SERVICE_NAME --no-allow-unauthenticated --region $REGION
   ```
4. **Monitor usage** in Cloud Console > Cloud Run > Metrics

---

## Alternative: Even Cheaper Setup (Artifact Registry + Manual Deploy)

If you already have Docker image built:

```bash
# 1. Create Artifact Registry repo (one-time)
gcloud artifacts repositories create ai-tryon-repo \
  --repository-format=docker \
  --location=$REGION

# 2. Configure Docker auth
gcloud auth configure-docker $REGION-docker.pkg.dev

# 3. Build and tag image
docker build -t $REGION-docker.pkg.dev/YOUR_PROJECT_ID/ai-tryon-repo/ai-tryon:latest .

# 4. Push image
docker push $REGION-docker.pkg.dev/YOUR_PROJECT_ID/ai-tryon-repo/ai-tryon:latest

# 5. Deploy from image
gcloud run deploy $SERVICE_NAME \
  --image $REGION-docker.pkg.dev/YOUR_PROJECT_ID/ai-tryon-repo/ai-tryon:latest \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_API_KEY=$GOOGLE_API_KEY \
  --memory 512Mi \
  --min-instances 0
```

This gives you more control but requires Docker installed locally.

---

## Troubleshooting

**Build fails?**
- Check `Dockerfile` and `.dockerignore` are in project root
- Ensure all dependencies in `package.json`

**App crashes on startup?**
- Check logs: `gcloud run services logs read $SERVICE_NAME --region $REGION --limit 50`
- Verify `GOOGLE_API_KEY` is set correctly

**High costs?**
- Check Cloud Console > Cloud Run > Metrics for unexpected traffic
- Set `--max-instances` lower
- Enable authentication to prevent abuse

**Need persistent storage for usage-data.json?**
- Mount Cloud Storage bucket or use Cloud Firestore
- For simple tracking, the file will reset on each new instance (expected with Cloud Run)
