'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, ChevronLeft, ChevronRight, Check, ZoomIn } from 'lucide-react';
import type { PdfPageData } from '@/lib/types';
import { renderAllPages, renderPageHighRes } from '@/lib/pdfUtils';

interface PdfViewerProps {
  pdfData: ArrayBuffer;
  fileName: string;
  onPageSelect: (pageNumber: number, pageUrl: string, totalPages: number) => void;
  selectedPage?: number;
  onRequestCrop: (pageUrl: string, pageNumber: number, width: number, height: number) => void;
}

export default function PdfViewer({
  pdfData,
  fileName,
  onPageSelect,
  selectedPage,
  onRequestCrop,
}: PdfViewerProps) {
  const [pages, setPages] = useState<PdfPageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingHighRes, setLoadingHighRes] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPages() {
      try {
        setLoading(true);
        const pageData = await renderAllPages(pdfData, 0.5);
        if (!cancelled) {
          setPages(pageData);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load PDF pages. The file may be corrupted or password-protected.');
          setLoading(false);
        }
      }
    }

    loadPages();
    return () => { cancelled = true; };
  }, [pdfData]);

  const handlePageClick = useCallback(async (pageNumber: number) => {
    try {
      setLoadingHighRes(pageNumber);
      const highResUrl = await renderPageHighRes(pdfData, pageNumber);
      onPageSelect(pageNumber, highResUrl, pages.length);
    } catch {
      setError('Failed to render page at high resolution.');
    } finally {
      setLoadingHighRes(null);
    }
  }, [pdfData, pages.length, onPageSelect]);

  const handleCropRequest = useCallback(async (pageNumber: number) => {
    try {
      setLoadingHighRes(pageNumber);
      const highResUrl = await renderPageHighRes(pdfData, pageNumber);
      const page = pages.find(p => p.pageNumber === pageNumber);
      if (page) {
        onRequestCrop(highResUrl, pageNumber, page.width * 6, page.height * 6);
      }
    } catch {
      setError('Failed to render page for cropping.');
    } finally {
      setLoadingHighRes(null);
    }
  }, [pdfData, pages, onRequestCrop]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 size={32} className="text-primary-600 animate-spin mb-3" />
        <p className="text-sm text-gray-500">Loading PDF pages...</p>
        <p className="text-xs text-gray-400 mt-1">{fileName}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700">
          {fileName} &mdash; {pages.length} pages
        </h4>
        {selectedPage && (
          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-medium">
            Selected: Page {selectedPage}
          </span>
        )}
      </div>

      <div className="pdf-grid">
        {pages.map((page) => (
          <div key={page.pageNumber} className="relative group">
            <button
              onClick={() => handlePageClick(page.pageNumber)}
              className={`fabric-thumbnail ${
                selectedPage === page.pageNumber ? 'fabric-thumbnail-selected' : ''
              }`}
            >
              <img
                src={page.thumbnailUrl}
                alt={`Page ${page.pageNumber}`}
                className="w-full h-full object-cover"
              />
              {loadingHighRes === page.pageNumber && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <Loader2 size={20} className="text-primary-600 animate-spin" />
                </div>
              )}
              {selectedPage === page.pageNumber && (
                <div className="absolute top-1 right-1 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                  <Check size={14} className="text-white" />
                </div>
              )}
            </button>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">
                Page {page.pageNumber}/{pages.length}
              </span>
              <button
                onClick={() => handleCropRequest(page.pageNumber)}
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Crop design from this page"
              >
                <ZoomIn size={12} />
                Crop
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
