'use client';

import { Shirt, Scissors, Wind } from 'lucide-react';
import type { GarmentSelections, GarmentType } from '@/lib/types';

interface GarmentSelectionProps {
  selections: GarmentSelections;
  onToggle: (garment: GarmentType) => void;
}

const GARMENTS: { type: GarmentType; label: string; description: string; icon: typeof Shirt }[] = [
  { type: 'top', label: 'Top (Kurti)', description: 'Upper garment / kurti', icon: Shirt },
  { type: 'bottom', label: 'Bottom (Salwar)', description: 'Lower garment / pants', icon: Scissors },
  { type: 'chunni', label: 'Chunni (Dupatta)', description: 'Scarf / dupatta draping', icon: Wind },
];

export default function GarmentSelection({ selections, onToggle }: GarmentSelectionProps) {
  const selectedCount = [selections.top, selections.bottom, selections.chunni].filter(Boolean).length;

  return (
    <div className="max-w-xl mx-auto animate-fade-in">
      <div className="text-center mb-6">
        <p className="text-sm text-gray-500">
          Select which garments to replace with new fabric designs.
          <br />
          Choose one, two, or all three.
        </p>
      </div>

      <div className="space-y-3">
        {GARMENTS.map(({ type, label, description, icon: Icon }) => (
          <button
            key={type}
            onClick={() => onToggle(type)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
              selections[type]
                ? 'border-primary-500 bg-primary-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                selections[type] ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              <Icon size={24} />
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold ${selections[type] ? 'text-primary-700' : 'text-gray-800'}`}>
                {label}
              </h3>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
            <div
              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                selections[type]
                  ? 'bg-primary-500 border-primary-500'
                  : 'border-gray-300 bg-white'
              }`}
            >
              {selections[type] && (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>

      {selectedCount === 0 && (
        <p className="mt-4 text-center text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
          Please select at least one garment to continue.
        </p>
      )}

      {selectedCount > 0 && (
        <div className="mt-4 text-center text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
          {selectedCount} garment{selectedCount > 1 ? 's' : ''} selected &mdash; {selectedCount === 3 ? 'Full outfit replacement' : 'Partial replacement'}
        </div>
      )}
    </div>
  );
}
