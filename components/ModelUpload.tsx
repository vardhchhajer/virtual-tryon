'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, X, User, Check } from 'lucide-react';
import { validateImageFile } from '@/lib/validation';

interface ModelUploadProps {
  modelPreviewUrl: string | null;
  onUpload: (file: File, previewUrl: string) => void;
  onClear: () => void;
}

export default function ModelUpload({ modelPreviewUrl, onUpload, onClear }: ModelUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error!);
      return;
    }
    setError(null);
    const url = URL.createObjectURL(file);
    onUpload(file, url);
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  if (modelPreviewUrl) {
    return (
      <div className="animate-fade-in">
        <div className="relative card overflow-hidden max-w-md mx-auto">
          <img
            src={modelPreviewUrl}
            alt="Model preview"
            className="w-full h-auto max-h-[500px] object-contain"
          />
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              onClick={onClear}
              className="p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
              title="Remove image"
            >
              <X size={16} />
            </button>
          </div>
          <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
            <Check size={14} />
            Model uploaded
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <div
        className={`upload-zone ${isDragging ? 'upload-zone-active' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
          <User size={32} className="text-primary-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Upload Model Image</h3>
        <p className="text-sm text-gray-500 text-center mb-4">
          Upload a full-body photo wearing a traditional three-piece outfit
        </p>
        <div className="flex items-center gap-2 text-primary-600 font-medium">
          <Upload size={18} />
          <span>Click or drag to upload</span>
        </div>
        <p className="text-xs text-gray-400 mt-3">JPG, PNG, WEBP &mdash; Max 20MB</p>
      </div>
      {error && (
        <div className="mt-3 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700 font-medium mb-1">Tips for best results:</p>
        <ul className="text-xs text-blue-600 space-y-1">
          <li>• Full-body shot with complete outfit visible</li>
          <li>• Well-lit, clear background preferred</li>
          <li>• Traditional three-piece outfit (kurti, salwar, chunni)</li>
          <li>• Front-facing or slight angle works best</li>
        </ul>
      </div>
    </div>
  );
}
