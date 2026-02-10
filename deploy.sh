# Quick deploy script for Google Cloud Run
# Usage: ./deploy.sh YOUR_PROJECT_ID YOUR_GEMINI_API_KEY

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: ./deploy.sh PROJECT_ID GOOGLE_API_KEY"
  echo "Example: ./deploy.sh my-gcp-project AIza..."
  exit 1
fi

PROJECT_ID=$1
GOOGLE_API_KEY=$2
SERVICE_NAME=ai-tryon
REGION=us-central1

echo "🚀 Deploying to Google Cloud Run..."
echo "   Project: $PROJECT_ID"
echo "   Service: $SERVICE_NAME"
echo "   Region: $REGION"
echo ""

gcloud config set project $PROJECT_ID

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

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your app is live at the URL shown above"
