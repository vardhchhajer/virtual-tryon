'use client';

import { useState, useRef, useCallback } from 'react';
import { Download, RefreshCw, RotateCcw, AlertTriangle, Check, Minimize2 } from 'lucide-react';
import type { GenerationResult, GarmentSelections, FabricSelections, AdvancedOptions, GarmentType } from '@/lib/types';
import { formatDesignNumber, generateAutoDesignNumber } from '@/lib/validation';

interface ResultDisplayProps {
  result: GenerationResult;
  modelPreviewUrl: string;
  garments: GarmentSelections;
  fabrics: FabricSelections;
  advancedOptions: AdvancedOptions;
  autoDesignCounter: number;
  onRegenerate: () => void;
  onStartOver: () => void;
}

export default function ResultDisplay({
  result,
  modelPreviewUrl,
  garments,
  fabrics,
  advancedOptions,
  autoDesignCounter,
  onRegenerate,
  onStartOver,
}: ResultDisplayProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleSliderMove = useCallback((clientX: number) => {
    if (!comparisonRef.current) return;
    const rect = comparisonRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = useCallback(() => setIsDragging(true), []);
  const handleMouseUp = useCallback(() => setIsDragging(false), []);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) handleSliderMove(e.clientX);
  }, [isDragging, handleSliderMove]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    handleSliderMove(e.touches[0].clientX);
  }, [handleSliderMove]);

  const selectedGarments = (Object.entries(garments) as [GarmentType, boolean][])
    .filter(([, sel]) => sel)
    .map(([type]) => type);

  const designCfg = advancedOptions.designNumber;
  const designNumberText = designCfg.enabled
    ? formatDesignNumber(
        designCfg.number || generateAutoDesignNumber(autoDesignCounter - 1),
        designCfg.format,
        designCfg.customFormat
      )
    : null;

  const handleDownload = useCallback((url: string, withNumber: boolean) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `virtual-tryon${withNumber && designNumberText ? `-${designNumberText}` : ''}-${Date.now()}.png`;
    link.click();
  }, [designNumberText]);

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Quality flags */}
      {result.qualityFlags.length > 0 && (
        <div className="mb-4 space-y-2">
          {result.qualityFlags.map((flag, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                flag.severity === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              <div>
                <span>{flag.message}</span>
                <button
                  onClick={onRegenerate}
                  className="block mt-1 text-xs underline opacity-80 hover:opacity-100"
                >
                  Regenerate with stricter controls
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comparison view */}
      <div className="card overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Result Comparison</h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Minimize2 size={14} />
            Drag slider to compare
          </div>
        </div>

        <div
          ref={comparisonRef}
          className="comparison-container relative cursor-ew-resize"
          style={{ height: '500px' }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
        >
          {/* Original */}
          <div className="absolute inset-0">
            <img
              src={modelPreviewUrl}
              alt="Original model"
              className="w-full h-full object-contain bg-gray-100"
            />
            <span className="absolute top-3 left-3 bg-gray-800/70 text-white px-3 py-1 rounded-full text-xs font-medium">
              Original
            </span>
          </div>

          {/* Generated (clipped) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
          >
            <img
              src={result.imageWithNumberUrl || result.imageUrl}
              alt="Generated result"
              className="w-full h-full object-contain bg-gray-50"
            />
            <span className="absolute top-3 right-3 bg-primary-600/90 text-white px-3 py-1 rounded-full text-xs font-medium">
              Generated
            </span>
            {designNumberText && (
              <span className="absolute top-3 right-24 bg-accent-600/90 text-white px-2 py-1 rounded text-xs font-bold">
                {designNumberText}
              </span>
            )}
          </div>

          {/* Slider */}
          <div
            className="comparison-slider"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
              <div className="flex gap-0.5">
                <div className="w-0.5 h-4 bg-gray-400 rounded" />
                <div className="w-0.5 h-4 bg-gray-400 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Source references */}
      <div className="card p-4 mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Sources Used:</h4>
        <div className="space-y-1.5">
          {selectedGarments.map(type => {
            const fabric = fabrics[type];
            return (
              <div key={type} className="flex items-center gap-2 text-sm">
                <span className="capitalize text-gray-600 font-medium w-14">• {type}:</span>
                {fabric && (
                  <span className="text-gray-500">
                    {fabric.type === 'image'
                      ? fabric.fileName
                      : `${fabric.fileName} (Page ${fabric.selectedPage})${fabric.croppedUrl ? ' [cropped]' : ''}`
                    }
                  </span>
                )}
              </div>
            );
          })}
          {advancedOptions.customPrompt && (
            <div className="flex items-start gap-2 text-sm">
              <span className="text-gray-600 font-medium w-14">•</span>
              <span className="text-gray-500 italic">
                Custom: &ldquo;{advancedOptions.customPrompt.substring(0, 80)}
                {advancedOptions.customPrompt.length > 80 ? '...' : ''}&rdquo;
              </span>
            </div>
          )}
          {designNumberText && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600 font-medium w-14">• #</span>
              <span className="text-gray-500 font-mono">{designNumberText}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => handleDownload(result.imageWithNumberUrl || result.imageUrl, true)}
          className="btn-primary"
        >
          <Download size={16} className="mr-2" />
          Download
        </button>
        {result.imageUrl !== result.imageWithNumberUrl && designNumberText && (
          <button
            onClick={() => handleDownload(result.imageUrl, false)}
            className="btn-secondary"
          >
            <Download size={16} className="mr-2" />
            Without Number
          </button>
        )}
        <button onClick={onRegenerate} className="btn-secondary">
          <RefreshCw size={16} className="mr-2" />
          Regenerate
        </button>
        <button onClick={onStartOver} className="btn-secondary text-red-600 border-red-200 hover:bg-red-50">
          <RotateCcw size={16} className="mr-2" />
          Start Over
        </button>
      </div>
    </div>
  );
}
