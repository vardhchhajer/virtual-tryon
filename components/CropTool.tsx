'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Check, RotateCcw, ZoomIn, ZoomOut, Move } from 'lucide-react';
import type { CropRegion } from '@/lib/types';
import { cropImage } from '@/lib/pdfUtils';

interface CropToolProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  onConfirmCrop: (croppedUrl: string) => void;
  onCancel: () => void;
}

export default function CropTool({
  imageUrl,
  imageWidth,
  imageHeight,
  onConfirmCrop,
  onCancel,
}: CropToolProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [crop, setCrop] = useState<CropRegion>({
    x: 50,
    y: 50,
    width: 200,
    height: 200,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (containerRef.current) {
      const containerW = containerRef.current.clientWidth;
      const aspect = imageWidth / imageHeight;
      const w = Math.min(containerW, 600);
      const h = w / aspect;
      setDisplaySize({ width: w, height: h });
      setCrop({
        x: w * 0.15,
        y: h * 0.15,
        width: w * 0.7,
        height: h * 0.7,
      });
    }
  }, [imageWidth, imageHeight]);

  const handleMouseDown = useCallback((e: React.MouseEvent, mode: 'move' | 'resize') => {
    e.preventDefault();
    e.stopPropagation();
    if (mode === 'move') {
      setIsDragging(true);
    } else {
      setIsResizing(true);
    }
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging && !isResizing) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setDragStart({ x: e.clientX, y: e.clientY });

    setCrop(prev => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(prev.x + dx, displaySize.width - prev.width));
        const newY = Math.max(0, Math.min(prev.y + dy, displaySize.height - prev.height));
        return { ...prev, x: newX, y: newY };
      }
      if (isResizing) {
        const newW = Math.max(50, Math.min(prev.width + dx, displaySize.width - prev.x));
        const newH = Math.max(50, Math.min(prev.height + dy, displaySize.height - prev.y));
        return { ...prev, width: newW, height: newH };
      }
      return prev;
    });
  }, [isDragging, isResizing, dragStart, displaySize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  const handleConfirm = useCallback(async () => {
    try {
      const croppedUrl = await cropImage(imageUrl, crop, displaySize.width, displaySize.height);
      onConfirmCrop(croppedUrl);
    } catch {
      // Fallback: use original image
      onConfirmCrop(imageUrl);
    }
  }, [imageUrl, crop, displaySize, onConfirmCrop]);

  const handleReset = useCallback(() => {
    setCrop({
      x: displaySize.width * 0.15,
      y: displaySize.height * 0.15,
      width: displaySize.width * 0.7,
      height: displaySize.height * 0.7,
    });
    setZoom(1);
  }, [displaySize]);

  return (
    <div className="card p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-800">Crop Design</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
            className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
            title="Zoom out"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-xs text-gray-500 min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(3, z + 0.25))}
            className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
            title="Zoom in"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
            title="Reset crop"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-lg bg-gray-100 select-none"
        style={{ maxHeight: '500px' }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
          <img
            src={imageUrl}
            alt="Crop source"
            style={{ width: displaySize.width, height: displaySize.height }}
            className="block"
            draggable={false}
          />

          {/* Dim overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: 'rgba(0,0,0,0.4)',
              clipPath: `polygon(
                0% 0%, 100% 0%, 100% 100%, 0% 100%,
                0% ${crop.y}px,
                ${crop.x}px ${crop.y}px,
                ${crop.x}px ${crop.y + crop.height}px,
                ${crop.x + crop.width}px ${crop.y + crop.height}px,
                ${crop.x + crop.width}px ${crop.y}px,
                0% ${crop.y}px
              )`,
            }}
          />

          {/* Crop selection */}
          <div
            className="crop-overlay"
            style={{
              left: crop.x,
              top: crop.y,
              width: crop.width,
              height: crop.height,
            }}
            onMouseDown={e => handleMouseDown(e, 'move')}
          >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Move size={20} className="text-primary-600 opacity-50" />
            </div>
            {/* Resize handle */}
            <div
              className="absolute bottom-0 right-0 w-4 h-4 bg-primary-600 cursor-se-resize rounded-tl"
              onMouseDown={e => handleMouseDown(e, 'resize')}
            />
            {/* Corner indicators */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary-500" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary-500" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary-500" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-gray-500">
          Drag to position, resize from bottom-right corner
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-secondary text-sm py-2 px-4">
            Cancel
          </button>
          <button onClick={handleConfirm} className="btn-primary text-sm py-2 px-4">
            <Check size={16} className="mr-1" />
            Confirm Crop
          </button>
        </div>
      </div>
    </div>
  );
}
