'use client';

import { Check } from 'lucide-react';
import type { WorkflowStep } from '@/lib/types';

interface ProgressIndicatorProps {
  currentStep: WorkflowStep;
}

const STEPS: { key: WorkflowStep; label: string; shortLabel: string }[] = [
  { key: 'upload-model', label: 'Upload Model', shortLabel: 'Model' },
  { key: 'select-garments', label: 'Select Garments', shortLabel: 'Garments' },
  { key: 'upload-fabrics', label: 'Choose Fabrics', shortLabel: 'Fabrics' },
  { key: 'advanced-options', label: 'Options', shortLabel: 'Options' },
  { key: 'review', label: 'Review', shortLabel: 'Review' },
  { key: 'generating', label: 'Generate', shortLabel: 'Generate' },
  { key: 'result', label: 'Result', shortLabel: 'Result' },
];

function getStepIndex(step: WorkflowStep): number {
  return STEPS.findIndex(s => s.key === step);
}

export default function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {STEPS.map((step, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isFuture = i > currentIndex;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                    ${isCompleted ? 'bg-green-500 text-white' : ''}
                    ${isCurrent ? 'bg-primary-600 text-white shadow-md ring-4 ring-primary-100' : ''}
                    ${isFuture ? 'bg-gray-200 text-gray-400' : ''}
                  `}
                >
                  {isCompleted ? <Check size={16} /> : i + 1}
                </div>
                <span
                  className={`mt-1.5 text-xs font-medium hidden sm:block ${
                    isCurrent ? 'text-primary-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  {step.shortLabel}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 mx-2 mt-[-16px] sm:mt-0">
                  <div className="h-0.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-green-500 w-full' : isCurrent ? 'bg-primary-400 w-1/2' : 'w-0'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
