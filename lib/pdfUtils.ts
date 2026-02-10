// PDF Utility functions using pdfjs-dist
// These run client-side in the browser

import type { PdfPageData, CropRegion } from './types';

let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfLib() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  }
  return pdfjsLib;
}

// ─── Load PDF and return page count ───

export async function loadPdf(file: File): Promise<{ numPages: number; pdfData: ArrayBuffer }> {
  const pdfData = await file.arrayBuffer();
  const lib = await getPdfLib();
  const loadingTask = lib.getDocument({ data: pdfData });
  const pdf = await loadingTask.promise;
  return { numPages: pdf.numPages, pdfData };
}

// ─── Render a single PDF page to a data URL ───

export async function renderPdfPage(
  pdfData: ArrayBuffer,
  pageNumber: number,
  scale: number = 1.5
): Promise<PdfPageData> {
  const lib = await getPdfLib();
  const loadingTask = lib.getDocument({ data: pdfData });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageNumber);

  const viewport = page.getViewport({ scale });
  const outputScale = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;

  canvas.width = Math.floor(viewport.width * outputScale);
  canvas.height = Math.floor(viewport.height * outputScale);
  canvas.style.width = Math.floor(viewport.width) + 'px';
  canvas.style.height = Math.floor(viewport.height) + 'px';

  const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] as [number, number, number, number, number, number] : undefined;

  const renderContext = {
    canvasContext: context,
    transform,
    viewport,
  };

  await page.render(renderContext).promise;

  const thumbnailUrl = canvas.toDataURL('image/png');

  return {
    pageNumber,
    thumbnailUrl,
    width: viewport.width,
    height: viewport.height,
  };
}

// ─── Render all pages as thumbnails ───

export async function renderAllPages(
  pdfData: ArrayBuffer,
  thumbnailScale: number = 0.5
): Promise<PdfPageData[]> {
  const lib = await getPdfLib();
  const loadingTask = lib.getDocument({ data: pdfData });
  const pdf = await loadingTask.promise;
  const pages: PdfPageData[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const pageData = await renderPdfPage(pdfData, i, thumbnailScale);
    pages.push(pageData);
  }

  return pages;
}

// ─── Render page at high resolution for fabric extraction ───

export async function renderPageHighRes(
  pdfData: ArrayBuffer,
  pageNumber: number
): Promise<string> {
  const pageData = await renderPdfPage(pdfData, pageNumber, 3.0); // 300 DPI equivalent
  return pageData.thumbnailUrl;
}

// ─── Crop a region from an image ───

export function cropImage(
  imageUrl: string,
  crop: CropRegion,
  sourceWidth: number,
  sourceHeight: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // Scale crop coordinates from display to actual image size
      const scaleX = img.naturalWidth / sourceWidth;
      const scaleY = img.naturalHeight / sourceHeight;

      const sx = crop.x * scaleX;
      const sy = crop.y * scaleY;
      const sw = crop.width * scaleX;
      const sh = crop.height * scaleY;

      canvas.width = sw;
      canvas.height = sh;

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}

// ─── Add design number overlay to an image ───

export function addDesignNumberOverlay(
  imageUrl: string,
  text: string,
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left',
  style: 'white-on-dark' | 'black-on-light',
  fontSize: 'small' | 'medium' | 'large'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      // Determine font size
      const baseFontSize = img.naturalWidth * 0.025;
      const sizeMultiplier = fontSize === 'small' ? 1 : fontSize === 'medium' ? 1.5 : 2;
      const actualFontSize = Math.max(12, Math.round(baseFontSize * sizeMultiplier));

      ctx.font = `bold ${actualFontSize}px Arial, sans-serif`;

      const metrics = ctx.measureText(text);
      const textWidth = metrics.width;
      const textHeight = actualFontSize;
      const padding = actualFontSize * 0.5;

      // Position calculation
      let x: number, y: number;
      switch (position) {
        case 'top-right':
          x = canvas.width - textWidth - padding * 2;
          y = padding;
          break;
        case 'top-left':
          x = padding;
          y = padding;
          break;
        case 'bottom-right':
          x = canvas.width - textWidth - padding * 2;
          y = canvas.height - textHeight - padding * 2;
          break;
        case 'bottom-left':
          x = padding;
          y = canvas.height - textHeight - padding * 2;
          break;
      }

      // Draw background
      const bgColor = style === 'white-on-dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)';
      ctx.fillStyle = bgColor;
      ctx.roundRect(x, y, textWidth + padding * 2, textHeight + padding, [4]);
      ctx.fill();

      // Draw text
      ctx.fillStyle = style === 'white-on-dark' ? '#ffffff' : '#000000';
      ctx.fillText(text, x + padding, y + textHeight);

      // Add outline for visibility
      ctx.strokeStyle = style === 'white-on-dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeText(text, x + padding, y + textHeight);

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}
