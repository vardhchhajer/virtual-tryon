'use client';

import type { GarmentSelections, FabricSelections, FabricSource, GarmentType } from '@/lib/types';
import FabricUpload from './FabricUpload';

interface FabricUploadPanelProps {
  garments: GarmentSelections;
  fabrics: FabricSelections;
  onFabricSelect: (garment: GarmentType, source: FabricSource) => void;
  onFabricClear: (garment: GarmentType) => void;
}

const GARMENT_LABELS: Record<GarmentType, string> = {
  top: 'Top (Kurti) Fabric',
  bottom: 'Bottom (Salwar) Fabric',
  chunni: 'Chunni (Dupatta) Fabric',
};

export default function FabricUploadPanel({
  garments,
  fabrics,
  onFabricSelect,
  onFabricClear,
}: FabricUploadPanelProps) {
  const selectedGarments = (Object.entries(garments) as [GarmentType, boolean][])
    .filter(([, selected]) => selected)
    .map(([type]) => type);

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <p className="text-sm text-gray-500">
          Upload fabric designs for each selected garment.
          <br />
          Use direct images or select from PDF catalogs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {selectedGarments.map(type => (
          <FabricUpload
            key={type}
            garment={type}
            label={GARMENT_LABELS[type]}
            fabric={fabrics[type]}
            onFabricSelect={onFabricSelect}
            onFabricClear={onFabricClear}
          />
        ))}
      </div>

      {/* Unified preview */}
      {Object.keys(fabrics).length > 0 && (
        <div className="mt-6 card p-4 max-w-xl mx-auto">
          <h4 className="font-semibold text-gray-700 mb-3">Selected Fabrics</h4>
          <div className="space-y-2">
            {selectedGarments.map(type => {
              const fabric = fabrics[type];
              return (
                <div key={type} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm font-medium text-gray-600 capitalize w-16">{type}:</span>
                  {fabric ? (
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-10 h-10 rounded border border-gray-200 overflow-hidden flex-shrink-0">
                        <img
                          src={fabric.type === 'image' ? fabric.previewUrl : (fabric.croppedUrl || fabric.pagePreviewUrl)}
                          alt={`${type} fabric`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xs text-gray-500 truncate">
                        {fabric.type === 'image'
                          ? fabric.fileName
                          : `${fabric.fileName} (Pg ${fabric.selectedPage})`
                        }
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-amber-500 italic">Not selected yet</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
