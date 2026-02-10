'use client';

import { useState, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronUp, Settings, AlertTriangle, Info, Sparkles } from 'lucide-react';
import type { AdvancedOptions as AdvancedOptionsType, DesignNumberConfig, DesignNumberFormat, DesignNumberPosition, DesignNumberStyle } from '@/lib/types';
import { validateCustomPrompt, validateDesignNumber, formatDesignNumber, generateAutoDesignNumber } from '@/lib/validation';

interface AdvancedOptionsProps {
  options: AdvancedOptionsType;
  autoDesignCounter: number;
  onChange: (options: Partial<AdvancedOptionsType>) => void;
}

const QUICK_PRESETS = [
  { label: 'More Vibrant', text: 'make colors more vibrant and saturated' },
  { label: 'Softer Colors', text: 'make colors softer and more pastel' },
  { label: 'Add Shimmer', text: 'add subtle golden shimmer to the fabric' },
  { label: 'Increase Contrast', text: 'increase pattern contrast and definition' },
  { label: 'Lighter Fabric', text: 'make fabric appear lighter and more flowing' },
  { label: 'Darker Tones', text: 'deepen the color tones for a richer appearance' },
];

export default function AdvancedOptions({ options, autoDesignCounter, onChange }: AdvancedOptionsProps) {
  const [expanded, setExpanded] = useState(false);

  // ─── Custom Prompt ───

  const handlePromptChange = useCallback((value: string) => {
    if (value.length <= 500) {
      onChange({ customPrompt: value });
    }
  }, [onChange]);

  const promptWarnings = useMemo(() => {
    if (!options.customPrompt.trim()) return [];
    return validateCustomPrompt(options.customPrompt);
  }, [options.customPrompt]);

  const addPreset = useCallback((text: string) => {
    const current = options.customPrompt;
    const separator = current.trim() ? ', ' : '';
    const newText = current + separator + text;
    if (newText.length <= 500) {
      onChange({ customPrompt: newText });
    }
  }, [options.customPrompt, onChange]);

  // ─── Design Number ───

  const updateDesignNumber = useCallback((update: Partial<DesignNumberConfig>) => {
    onChange({
      designNumber: { ...options.designNumber, ...update },
    });
  }, [options.designNumber, onChange]);

  const designNumberPreview = useMemo(() => {
    const config = options.designNumber;
    if (!config.enabled) return null;
    const num = config.number || generateAutoDesignNumber(autoDesignCounter);
    return formatDesignNumber(num, config.format, config.customFormat);
  }, [options.designNumber, autoDesignCounter]);

  const designNumberValidation = useMemo(() => {
    if (!options.designNumber.enabled || !options.designNumber.number) return null;
    return validateDesignNumber(options.designNumber.number);
  }, [options.designNumber]);

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 card hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings size={18} className="text-gray-500" />
          <span className="font-semibold text-gray-700">Advanced Options</span>
          {options.customPrompt && (
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">Prompt set</span>
          )}
          {options.designNumber.enabled && (
            <span className="text-xs bg-accent-100 text-accent-700 px-2 py-0.5 rounded-full">Number set</span>
          )}
        </div>
        {expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="card mt-1 p-6 space-y-8 animate-slide-down">
          {/* ═══ Custom Prompt Instructions ═══ */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-primary-600" />
              <h4 className="font-semibold text-gray-800">Additional Prompt Instructions</h4>
              <span className="text-xs text-gray-400">(Optional)</span>
            </div>

            <textarea
              value={options.customPrompt}
              onChange={e => handlePromptChange(e.target.value)}
              placeholder="Example: make the fabric look more vibrant, add subtle golden shimmer to chunni, ensure pleats are more defined..."
              className="input-field resize-none h-28"
              maxLength={500}
            />

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Info size={12} />
                Focus on color, texture, and lighting adjustments. Avoid geometry changes.
              </div>
              <span className={`text-xs ${options.customPrompt.length > 450 ? 'text-amber-500' : 'text-gray-400'}`}>
                {options.customPrompt.length}/500
              </span>
            </div>

            {/* Warnings */}
            {promptWarnings.length > 0 && (
              <div className="mt-3 space-y-2">
                {promptWarnings.map((w, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 px-3 py-2 rounded-lg text-sm ${
                      w.severity === 'blocked'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>{w.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Presets */}
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">Quick Presets:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_PRESETS.map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => addPreset(preset.text)}
                    className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-primary-50 hover:text-primary-600 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Help text */}
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600 font-medium mb-1">Custom Prompt Tips:</p>
              <p className="text-xs text-gray-500">
                <span className="text-green-600">&#10003; Good:</span> &ldquo;make colors warmer&rdquo;, &ldquo;add subtle sheen&rdquo;, &ldquo;increase contrast&rdquo;
                <br />
                <span className="text-red-500">&#10007; Avoid:</span> &ldquo;change neckline&rdquo;, &ldquo;make sleeves longer&rdquo;, &ldquo;different style&rdquo;
              </p>
            </div>
          </div>

          {/* ═══ Design Number ═══ */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🔢</span>
              <h4 className="font-semibold text-gray-800">Design Number</h4>
              <span className="text-xs text-gray-400">(Optional)</span>
            </div>

            {/* Enable toggle */}
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={options.designNumber.enabled}
                onChange={e => updateDesignNumber({ enabled: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Add design number to generated image</span>
            </label>

            {options.designNumber.enabled && (
              <div className="space-y-4 pl-7 animate-slide-down">
                {/* Number input */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Number:</label>
                  <input
                    type="text"
                    value={options.designNumber.number}
                    onChange={e => updateDesignNumber({ number: e.target.value })}
                    placeholder={generateAutoDesignNumber(autoDesignCounter)}
                    className="input-field max-w-xs"
                    maxLength={15}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {options.designNumber.number.length}/15 characters
                    {!options.designNumber.number && ` • Auto: ${generateAutoDesignNumber(autoDesignCounter)}`}
                  </p>
                  {designNumberValidation && !designNumberValidation.valid && (
                    <p className="text-xs text-red-500 mt-1">{designNumberValidation.error}</p>
                  )}
                </div>

                {/* Format selection */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Format:</label>
                  <div className="flex flex-wrap gap-2">
                    {(['DES-XXXX', 'D-XXXX', 'XXXX', 'custom'] as DesignNumberFormat[]).map(fmt => (
                      <button
                        key={fmt}
                        onClick={() => updateDesignNumber({ format: fmt })}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          options.designNumber.format === fmt
                            ? 'bg-primary-50 border-primary-500 text-primary-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {fmt === 'custom' ? 'Custom' : fmt}
                      </button>
                    ))}
                  </div>
                  {options.designNumber.format === 'custom' && (
                    <input
                      type="text"
                      value={options.designNumber.customFormat}
                      onChange={e => updateDesignNumber({ customFormat: e.target.value })}
                      placeholder="Prefix (e.g., SKU-, COLL-)"
                      className="input-field max-w-xs mt-2"
                      maxLength={10}
                    />
                  )}
                </div>

                {/* Position */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Position:</label>
                  <div className="flex flex-wrap gap-2">
                    {(['top-right', 'top-left', 'bottom-right', 'bottom-left'] as DesignNumberPosition[]).map(pos => (
                      <button
                        key={pos}
                        onClick={() => updateDesignNumber({ position: pos })}
                        className={`text-xs px-3 py-1.5 rounded-lg border capitalize transition-colors ${
                          options.designNumber.position === pos
                            ? 'bg-primary-50 border-primary-500 text-primary-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {pos.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Style */}
                <div className="flex gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Style:</label>
                    <div className="flex gap-2">
                      {(['white-on-dark', 'black-on-light'] as DesignNumberStyle[]).map(s => (
                        <button
                          key={s}
                          onClick={() => updateDesignNumber({ style: s })}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                            options.designNumber.style === s
                              ? 'bg-primary-50 border-primary-500 text-primary-700'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {s === 'white-on-dark' ? 'White text' : 'Black text'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Size:</label>
                    <div className="flex gap-2">
                      {(['small', 'medium', 'large'] as const).map(size => (
                        <button
                          key={size}
                          onClick={() => updateDesignNumber({ fontSize: size })}
                          className={`text-xs px-3 py-1.5 rounded-lg border capitalize transition-colors ${
                            options.designNumber.fontSize === size
                              ? 'bg-primary-50 border-primary-500 text-primary-700'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                {designNumberPreview && (
                  <div className="p-4 bg-gray-900 rounded-lg relative">
                    <div
                      className={`absolute ${
                        options.designNumber.position === 'top-right' ? 'top-2 right-2' :
                        options.designNumber.position === 'top-left' ? 'top-2 left-2' :
                        options.designNumber.position === 'bottom-right' ? 'bottom-2 right-2' :
                        'bottom-2 left-2'
                      }`}
                    >
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          options.designNumber.style === 'white-on-dark'
                            ? 'bg-black/60 text-white'
                            : 'bg-white/80 text-black'
                        } ${
                          options.designNumber.fontSize === 'small' ? 'text-xs' :
                          options.designNumber.fontSize === 'medium' ? 'text-sm' : 'text-base'
                        }`}
                      >
                        {designNumberPreview}
                      </span>
                    </div>
                    <div className="text-center py-6">
                      <p className="text-gray-500 text-xs">Image Preview Area</p>
                    </div>
                  </div>
                )}

                {/* Help text */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500">
                    <strong>Auto:</strong> System generates sequential numbers (DES-0001, DES-0002...)
                    <br />
                    <strong>Custom:</strong> Enter your catalog/SKU number
                    <br />
                    Number appears on the final image and can be downloaded without it.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
