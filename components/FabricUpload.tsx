'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Image, X, RefreshCw } from 'lucide-react';
import type { GarmentType, FabricSource, FabricSourceType } from '@/lib/types';
import { validateImageFile, validatePdfFile } from '@/lib/validation';
import { loadPdf } from '@/lib/pdfUtils';
import PdfViewer from './PdfViewer';
import CropTool from './CropTool';

interface FabricUploadProps {
  garment: GarmentType;
  label: string;
  fabric?: FabricSource;
  onFabricSelect: (garment: GarmentType, source: FabricSource) => void;
  onFabricClear: (garment: GarmentType) => void;
}

export default function FabricUpload({
  garment,
  label,
  fabric,
  onFabricSelect,
  onFabricClear,
}: FabricUploadProps) {
  const [sourceType, setSourceType] = useState<FabricSourceType>('image');
  const [error, setError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // PDF state
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedPage, setSelectedPage] = useState<number | undefined>();

  // Crop state
  const [cropMode, setCropMode] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState<string>('');
  const [cropPageNumber, setCropPageNumber] = useState(0);
  const [cropDimensions, setCropDimensions] = useState({ width: 0, height: 0 });

  // ─── Image Upload Handler ───

  const handleImageUpload = useCallback((file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error!);
      return;
    }
    setError(null);
    const previewUrl = URL.createObjectURL(file);
    onFabricSelect(garment, {
      type: 'image',
      file,
      previewUrl,
      fileName: file.name,
    });
  }, [garment, onFabricSelect]);

  // ─── PDF Upload Handler ───

  const handlePdfUpload = useCallback(async (file: File) => {
    const validation = validatePdfFile(file);
    if (!validation.valid) {
      setError(validation.error!);
      return;
    }
    setError(null);

    try {
      setPdfLoading(true);
      const { numPages, pdfData: data } = await loadPdf(file);
      setPdfData(data);
      setPdfFileName(file.name);
      setTotalPages(numPages);
      setSelectedPage(undefined);
    } catch {
      setError('Failed to load PDF. It may be password-protected or corrupted.');
    } finally {
      setPdfLoading(false);
    }
  }, []);

  // ─── PDF Page Selection ───

  const handlePageSelect = useCallback((pageNumber: number, pageUrl: string, total: number) => {
    setSelectedPage(pageNumber);
    onFabricSelect(garment, {
      type: 'pdf',
      file: new File([], pdfFileName),
      fileName: pdfFileName,
      selectedPage: pageNumber,
      pagePreviewUrl: pageUrl,
      totalPages: total,
    });
  }, [garment, pdfFileName, onFabricSelect]);

  // ─── Crop Request ───

  const handleCropRequest = useCallback((pageUrl: string, pageNumber: number, width: number, height: number) => {
    setCropImageUrl(pageUrl);
    setCropPageNumber(pageNumber);
    setCropDimensions({ width, height });
    setCropMode(true);
  }, []);

  // ─── Crop Confirm ───

  const handleCropConfirm = useCallback((croppedUrl: string) => {
    setCropMode(false);
    onFabricSelect(garment, {
      type: 'pdf',
      file: new File([], pdfFileName),
      fileName: pdfFileName,
      selectedPage: cropPageNumber,
      pagePreviewUrl: croppedUrl,
      croppedUrl,
      totalPages,
    });
    setSelectedPage(cropPageNumber);
  }, [garment, pdfFileName, cropPageNumber, totalPages, onFabricSelect]);

  // ─── Reset ───

  const handleReset = useCallback(() => {
    onFabricClear(garment);
    setPdfData(null);
    setPdfFileName('');
    setTotalPages(0);
    setSelectedPage(undefined);
    setCropMode(false);
    setError(null);
  }, [garment, onFabricClear]);

  // ─── Get preview thumbnail ───

  const getPreviewUrl = (): string | null => {
    if (!fabric) return null;
    if (fabric.type === 'image') return fabric.previewUrl;
    return fabric.croppedUrl || fabric.pagePreviewUrl;
  };

  // ─── Render Crop Mode ───

  if (cropMode) {
    return (
      <CropTool
        imageUrl={cropImageUrl}
        imageWidth={cropDimensions.width}
        imageHeight={cropDimensions.height}
        onConfirmCrop={handleCropConfirm}
        onCancel={() => setCropMode(false)}
      />
    );
  }

  // ─── If fabric already selected, show preview ───

  const previewUrl = getPreviewUrl();

  return (
    <div className="card p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-800 capitalize">{label}</h4>
        {fabric && (
          <button
            onClick={handleReset}
            className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors"
          >
            <RefreshCw size={12} />
            Change
          </button>
        )}
      </div>

      {/* Source type toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setSourceType('image'); setPdfData(null); }}
          className={sourceType === 'image' ? 'toggle-btn-active' : 'toggle-btn-inactive'}
        >
          <Image size={14} className="inline mr-1.5" />
          Image Upload
        </button>
        <button
          onClick={() => setSourceType('pdf')}
          className={sourceType === 'pdf' ? 'toggle-btn-active' : 'toggle-btn-inactive'}
        >
          <FileText size={14} className="inline mr-1.5" />
          PDF Catalog
        </button>
      </div>

      {/* Show preview if selected */}
      {previewUrl && (
        <div className="mb-4">
          <div className="relative w-full max-w-[200px] aspect-square rounded-lg overflow-hidden border-2 border-primary-300 shadow-md">
            <img src={previewUrl} alt={`${label} fabric`} className="w-full h-full object-cover" />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {fabric?.type === 'image' ? `Source: ${fabric.fileName}` : `Source: ${fabric?.fileName} (Page ${fabric?.selectedPage})${fabric?.croppedUrl ? ' [cropped]' : ''}`}
          </p>
        </div>
      )}

      {/* Image upload mode */}
      {sourceType === 'image' && !fabric && (
        <div>
          <div
            className="upload-zone py-6"
            onClick={() => imageInputRef.current?.click()}
          >
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
            />
            <Upload size={24} className="text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">Click to upload fabric image</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP</p>
          </div>
        </div>
      )}

      {/* PDF upload mode */}
      {sourceType === 'pdf' && !pdfData && !fabric && (
        <div>
          <div
            className="upload-zone py-6"
            onClick={() => pdfInputRef.current?.click()}
          >
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handlePdfUpload(file);
              }}
            />
            <FileText size={24} className="text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">Click to upload PDF Catalog</p>
            <p className="text-xs text-gray-400 mt-1">PDF files up to 50MB</p>
          </div>

          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-600">
              <strong>Tip:</strong> Best results with high-resolution scans (300 DPI+).
              Single design per page works best, or use the crop tool for multi-design pages.
            </p>
          </div>
        </div>
      )}

      {/* PDF viewer */}
      {sourceType === 'pdf' && pdfData && !fabric && (
        <PdfViewer
          pdfData={pdfData}
          fileName={pdfFileName}
          onPageSelect={handlePageSelect}
          selectedPage={selectedPage}
          onRequestCrop={handleCropRequest}
        />
      )}

      {/* PDF loading */}
      {pdfLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mr-2" />
          <span className="text-sm text-gray-500">Loading PDF...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
