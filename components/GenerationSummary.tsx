'use client';

import { useMemo } from 'react';
import { Clock, Edit3, Zap } from 'lucide-react';
import type { GarmentSelections, FabricSelections, AdvancedOptions, GarmentType } from '@/lib/types';
import { formatDesignNumber, generateAutoDesignNumber } from '@/lib/validation';
import { getEstimatedTime } from '@/lib/promptBuilder';

interface GenerationSummaryProps {
  modelPreviewUrl: string;
  garments: GarmentSelections;
  fabrics: FabricSelections;
  advancedOptions: AdvancedOptions;
  autoDesignCounter: number;
  onEdit: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export default function GenerationSummary({
  modelPreviewUrl,
  garments,
  fabrics,
  advancedOptions,
  autoDesignCounter,
  onEdit,
  onGenerate,
  isGenerating,
}: GenerationSummaryProps) {
  const selectedGarments = useMemo(() =>
    (Object.entries(garments) as [GarmentType, boolean][])
      .filter(([, sel]) => sel)
      .map(([type]) => type),
    [garments]
  );

  const designNumberText = useMemo(() => {
    const cfg = advancedOptions.designNumber;
    if (!cfg.enabled) return null;
    const num = cfg.number || generateAutoDesignNumber(autoDesignCounter);
    return formatDesignNumber(num, cfg.format, cfg.customFormat);
  }, [advancedOptions.designNumber, autoDesignCounter]);

  const estimatedTime = getEstimatedTime(garments);

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📋</span>
          <h3 className="text-lg font-bold text-gray-800">Generation Summary</h3>
        </div>

        <div className="space-y-4">
          {/* Model */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-500 w-28">Model:</span>
            <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
              <img src={modelPreviewUrl} alt="Model" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Garments */}
          <div>
            <span className="text-sm font-medium text-gray-500 block mb-2">Garments to replace:</span>
            <div className="space-y-2 pl-4">
              {selectedGarments.map(type => {
                const fabric = fabrics[type];
                return (
                  <div key={type} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 capitalize font-medium w-14">• {type}:</span>
                    {fabric && (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded border border-gray-200 overflow-hidden">
                          <img
                            src={fabric.type === 'image' ? fabric.previewUrl : (fabric.croppedUrl || fabric.pagePreviewUrl)}
                            alt={`${type} fabric`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {fabric.type === 'image'
                            ? fabric.fileName
                            : `${fabric.fileName} (Page ${fabric.selectedPage})`
                          }
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom instructions */}
          {advancedOptions.customPrompt && (
            <div>
              <span className="text-sm font-medium text-gray-500 block mb-1">Custom instructions:</span>
              <p className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg italic">
                &ldquo;{advancedOptions.customPrompt}&rdquo;
              </p>
            </div>
          )}

          {/* Design number */}
          {designNumberText && (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-500 w-28">Design number:</span>
              <span className="text-sm font-bold text-primary-700 bg-primary-50 px-3 py-1 rounded-lg">
                {designNumberText}
              </span>
            </div>
          )}

          {/* Estimated time */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-500 w-28">Estimated time:</span>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock size={14} />
              {estimatedTime}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onEdit}
            className="btn-secondary"
          >
            <Edit3 size={16} className="mr-2" />
            Edit
          </button>
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="btn-primary"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Zap size={16} className="mr-2" />
                Generate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
