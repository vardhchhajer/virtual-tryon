'use client';

import { Loader2 } from 'lucide-react';

interface GeneratingOverlayProps {
  estimatedTime: string;
}

export default function GeneratingOverlay({ estimatedTime }: GeneratingOverlayProps) {
  return (
    <div className="max-w-md mx-auto text-center py-16 animate-fade-in">
      <div className="relative inline-block mb-6">
        <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
          <Loader2 size={40} className="text-primary-600 animate-spin" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-accent-500 flex items-center justify-center animate-pulse">
          <span className="text-white text-sm">✨</span>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-2">Generating Your Design</h2>
      <p className="text-gray-500 mb-6">AI is applying fabric textures while preserving garment geometry...</p>

      {/* Progress bar */}
      <div className="w-full max-w-xs mx-auto h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
        <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full progress-bar-animated" style={{ width: '70%' }} />
      </div>

      <p className="text-sm text-gray-400">Estimated time: {estimatedTime}</p>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg max-w-sm mx-auto">
        <p className="text-xs text-gray-500">
          <strong>What&apos;s happening:</strong>
          <br />
          1. Analyzing garment boundaries...
          <br />
          2. Mapping fabric textures to geometry...
          <br />
          3. Preserving folds, shadows &amp; drape...
          <br />
          4. Applying quality checks...
        </p>
      </div>
    </div>
  );
}
