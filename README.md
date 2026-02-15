<![CDATA[<div align="center">

# 👗 AI Virtual Try-On — Fabric Design Studio

**Reimagine traditional garments with AI-powered fabric replacement**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-3_Pro_Image-4285F4?logo=google)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)
[![Cloud Run](https://img.shields.io/badge/Cloud_Run-Deploy-4285F4?logo=googlecloud)](https://cloud.google.com/run)

---

Upload a model photo → Select garments → Choose fabrics → Get AI-edited results in seconds.

</div>

---

## 📖 Project Description

**AI Virtual Try-On** is a full-stack web application that enables users to digitally replace fabric textures on traditional South Asian garments (kurti/top, salwar/bottom, chunni/dupatta) using Google's **Gemini 3 Pro Image Preview** AI model. Designed for fashion designers, fabric retailers, and textile businesses, it streamlines the process of visualizing how different fabric patterns and colors would look on model photographs — eliminating the need for physical samples and photo shoots.

The application follows a guided **5-step wizard workflow**: upload a model image, select which garments to modify, upload fabric reference images (from direct image files or extracted from PDF catalogs), configure advanced options (custom prompts, design number overlays), and review before generating. The AI preserves the original garment geometry, pose, shadows, and draping while seamlessly applying the new fabric textures.

---

## ✨ Features

### 🎯 Core Functionality
- **AI-Powered Fabric Replacement** — Uses Gemini 3 Pro Image to replace fabric textures while preserving garment geometry, folds, shadows, and draping
- **Multi-Garment Support** — Independently replace fabric on **top (kurti)**, **bottom (salwar)**, and **chunni (dupatta)** — individually or in any combination
- **2K High-Resolution Output** — Generated images are rendered at 2K resolution with a 4:5 portrait aspect ratio optimized for fashion photography

### 📄 PDF Catalog Support
- **PDF Fabric Extraction** — Upload PDF fabric catalogs and browse pages as thumbnails
- **Page-Level Selection** — Choose any page from a multi-page PDF as your fabric source
- **Precision Cropping** — Crop specific regions from PDF pages to isolate the exact fabric pattern you want
- **High-Resolution Rendering** — PDF pages rendered at 300 DPI equivalent for crisp fabric details

### 🎨 Advanced Design Controls
- **Custom Prompt Injection** — Add texture/color modification instructions (e.g., "add subtle golden shimmer", "make colors more vibrant")
- **Quick Presets** — One-click prompt presets for common adjustments (Vibrant, Softer Colors, Shimmer, Contrast, etc.)
- **Prompt Safety Validation** — Blocks keywords that would alter garment geometry; warns on ambiguous terms
- **Prompt Sanitization** — Protects against injection attacks and enforces character limits

### 🔢 Design Number Overlay
- **Automatic Numbering** — Auto-incrementing design numbers (DES-0001, DES-0002, ...)
- **Custom Formats** — Choose from `DES-XXXX`, `D-XXXX`, `XXXX`, or define a custom prefix
- **Positioning** — Place the overlay at any corner (top-right, top-left, bottom-right, bottom-left)
- **Styling** — White-on-dark or black-on-light styles with configurable font sizes

### 📊 Usage Dashboard
- **Real-Time Cost Tracking** — Monitors API token usage and calculates costs based on Gemini pricing
- **Generation History** — View recent generations with timestamps, token counts, and costs
- **Session Statistics** — Total generations, success rate, average cost per image, total spend
- **Persistent Storage** — Usage data survives server restarts via local JSON file

### 🔐 Email OTP Authentication
- **Secure Access Control** — Email-based OTP verification via Gmail SMTP
- **Session Persistence** — Authentication state persisted in `localStorage` for seamless re-visits
- **Configurable Recipients** — Restrict access to specific email addresses

### ⚡ Quality & Safety
- **Quality Flags** — Automatic detection of generation issues (geometry changes, fabric bleed, border shifts)
- **Graceful Fallbacks** — Returns original model image if AI generation produces no output
- **File Validation** — Client-side validation for image files (JPG, PNG, WEBP up to 20MB) and PDFs (up to 50MB)
- **Detailed Error Handling** — User-friendly messages for API key issues, rate limits, safety filter blocks

---

## 🏗️ Architecture

```
ai-virtual-tryon/
├── app/                         # Next.js App Router
│   ├── layout.tsx               # Root layout with AuthGate, header, and metadata
│   ├── page.tsx                 # Main wizard page (5-step workflow controller)
│   ├── globals.css              # Global styles and design tokens
│   └── api/
│       ├── generate/route.ts    # POST — Gemini image generation endpoint
│       ├── auth/
│       │   ├── send-otp/route.ts    # POST — Send OTP via Gmail SMTP
│       │   └── verify-otp/route.ts  # POST — Verify OTP code
│       └── usage/route.ts       # GET — Fetch usage statistics
│
├── components/                  # React UI Components
│   ├── AuthGate.tsx             # Email OTP authentication gate
│   ├── ProgressIndicator.tsx    # Step progress bar
│   ├── ModelUpload.tsx          # Step 1 — Model image upload
│   ├── GarmentSelection.tsx     # Step 2 — Garment type toggle
│   ├── FabricUploadPanel.tsx    # Step 3 — Fabric upload orchestrator
│   ├── FabricUpload.tsx         # Individual fabric upload (image/PDF)
│   ├── PdfViewer.tsx            # PDF page browser and selector
│   ├── CropTool.tsx             # Interactive crop region selector
│   ├── AdvancedOptions.tsx      # Step 4 — Custom prompts & design numbers
│   ├── GenerationSummary.tsx    # Step 5 — Review before generation
│   ├── GeneratingOverlay.tsx    # Loading state with estimated time
│   ├── ResultDisplay.tsx        # Generated image display & download
│   └── UsageDashboard.tsx       # Floating usage statistics panel
│
├── hooks/
│   └── useWorkflow.ts           # Central workflow state management hook
│
├── lib/                         # Shared utilities
│   ├── types.ts                 # TypeScript type definitions
│   ├── promptBuilder.ts         # AI prompt construction per garment combo
│   ├── validation.ts            # Input validation & prompt sanitization
│   ├── pdfUtils.ts              # PDF rendering, cropping, & overlays
│   ├── usageTracker.ts          # Server-side API cost tracking
│   └── otpStore.ts              # In-memory OTP storage
│
├── Dockerfile                   # Multi-stage Docker build (Node 20 slim)
├── next.config.js               # Next.js config (standalone + pdf.js)
├── tailwind.config.js           # Custom color palette & animations
├── package.json                 # Dependencies & scripts
└── DEPLOY.md                    # Google Cloud Run deployment guide
```

---

## 🔧 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 (App Router) | Server-side rendering, API routes, file-based routing |
| **UI** | React 18 + TypeScript | Component-based UI with full type safety |
| **Styling** | Tailwind CSS 3.4 | Utility-first CSS with custom design tokens |
| **AI Engine** | Google Gemini 3 Pro Image Preview | Multi-modal image generation with fabric replacement |
| **PDF Processing** | pdfjs-dist | Client-side PDF rendering and page extraction |
| **Icons** | Lucide React | Consistent, lightweight icon library |
| **Auth** | Nodemailer (Gmail SMTP) | Email-based OTP authentication |
| **Deployment** | Docker + Google Cloud Run | Containerized, serverless deployment |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (recommended: 20 LTS)
- **npm** 9+
- **Google API Key** with [Generative Language API](https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com) enabled

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/ai-virtual-tryon.git
cd ai-virtual-tryon

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Required — Google Gemini API Key
GOOGLE_API_KEY=your_google_api_key_here

# Optional — Gmail SMTP for OTP Authentication
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password
```

> **Note:** To get a Gmail App Password, enable [2-Step Verification](https://myaccount.google.com/signinoptions/twosv) first, then create an App Password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## 🐳 Docker

```bash
# Build image
docker build -t ai-virtual-tryon .

# Run container
docker run -p 8080:8080 \
  -e GOOGLE_API_KEY=your_api_key \
  ai-virtual-tryon
```

---

## ☁️ Deployment (Google Cloud Run)

The application is optimized for **Google Cloud Run** with:
- **$0 idle cost** — scales to zero when not in use
- **Pay-per-request** pricing (~$0.40 per 1M requests)
- **Free tier** — 2M requests/month, 360K GB-seconds/month

```bash
# One-command deploy
gcloud run deploy ai-tryon \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_API_KEY=$GOOGLE_API_KEY \
  --memory 512Mi \
  --min-instances 0 \
  --max-instances 10
```

See [`DEPLOY.md`](./DEPLOY.md) for the full deployment guide with cost estimates.

---

## 📸 How It Works

### Workflow

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  1. Upload   │───▶│  2. Select   │───▶│  3. Upload   │───▶│  4. Advanced │───▶│  5. Review  │
│  Model Image │    │  Garments    │    │  Fabrics     │    │  Options     │    │  & Generate │
└─────────────┘    └──────────────┘    └──────────────┘    └──────────────┘    └──────┬──────┘
                                                                                      │
                                                                                      ▼
                                                                               ┌─────────────┐
                                                                               │   Result     │
                                                                               │   Display    │
                                                                               └─────────────┘
```

1. **Upload Model Image** — Upload a photo of a model wearing traditional South Asian attire (kurti + salwar + chunni)
2. **Select Garments** — Toggle which garments to replace (top, bottom, chunni — any combination)
3. **Upload Fabrics** — For each selected garment, upload a fabric image or extract from a PDF catalog
4. **Advanced Options** — Optionally add custom prompt modifiers and design number overlays
5. **Review & Generate** — Preview your selections and generate the AI-edited image

### AI Prompt Engineering

The system uses specialized prompt templates per garment combination (7 total combinations) that strictly enforce:
- **Geometry preservation** — Garment shape, seams, folds, and drape remain unchanged
- **Targeted replacement** — Each fabric only affects its designated garment area
- **Context preservation** — Pose, background, accessories, and lighting are untouched
- **Negative constraints** — Explicit blocks against silhouette changes, fabric bleeding, and redesign

---

## 💰 Cost Estimates

| Usage | Estimated Monthly Cost |
|-------|----------------------|
| 100 generations/month | ~$3.56 (API) + ~$0.36 (Cloud Run) |
| 500 generations/month | ~$17.80 (API) + ~$1.80 (Cloud Run) |
| 1,000 generations/month | ~$35.60 (API) + ~$3.60 (Cloud Run) |

*Based on Gemini 3 Pro Image Preview pricing: $1.25/1M input tokens, $5.00/1M output tokens, $0.0032/input image, $0.032/output image.*

---

## 🛠️ Development

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build production bundle (standalone output) |
| `npm start` | Start production server |
| `npm run lint` | Run Next.js linting |

### Key Design Decisions

- **Standalone Output** — Next.js standalone mode for minimal Docker images (~100MB vs ~1GB)
- **Client-Side PDF** — PDF rendering via `pdfjs-dist` runs entirely in the browser for privacy
- **Server-Side Usage Tracking** — JSON file persistence avoids database dependencies
- **Prompt Templates** — Pre-engineered prompts per garment combination prevent geometry drift
- **Multi-Stage Docker** — Three-stage build (deps → builder → runner) for production-optimized images

---

## 📄 License

This project is private and proprietary.

---

<div align="center">
  <sub>Built with ❤️ using Next.js, Google Gemini, and TypeScript</sub>
</div>
]]>
