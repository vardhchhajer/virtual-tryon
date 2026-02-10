# Quick deploy script for Google Cloud Run (PowerShell)
# Usage: .\deploy.ps1 YOUR_PROJECT_ID YOUR_GEMINI_API_KEY

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId,
    
    [Parameter(Mandatory=$true)]
    [string]$GoogleApiKey
)

$ServiceName = "ai-tryon"
$Region = "us-central1"

Write-Host "🚀 Deploying to Google Cloud Run..." -ForegroundColor Cyan
Write-Host "   Project: $ProjectId"
Write-Host "   Service: $ServiceName"
Write-Host "   Region: $Region"
Write-Host ""

gcloud config set project $ProjectId

gcloud run deploy $ServiceName `
  --source . `
  --region $Region `
  --platform managed `
  --allow-unauthenticated `
  --set-env-vars GOOGLE_API_KEY=$GoogleApiKey `
  --memory 512Mi `
  --cpu 1 `
  --min-instances 0 `
  --max-instances 10 `
  --timeout 300

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Your app is live at the URL shown above"
