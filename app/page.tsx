'use client';

import { useCallback } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useWorkflow } from '@/hooks/useWorkflow';
import type { WorkflowStep, GenerationResult } from '@/lib/types';
import { buildFinalPrompt, getEstimatedTime } from '@/lib/promptBuilder';
import { formatDesignNumber, generateAutoDesignNumber } from '@/lib/validation';
import { addDesignNumberOverlay } from '@/lib/pdfUtils';

import ProgressIndicator from '@/components/ProgressIndicator';
import ModelUpload from '@/components/ModelUpload';
import GarmentSelection from '@/components/GarmentSelection';
import FabricUploadPanel from '@/components/FabricUploadPanel';
import AdvancedOptions from '@/components/AdvancedOptions';
import GenerationSummary from '@/components/GenerationSummary';
import GeneratingOverlay from '@/components/GeneratingOverlay';
import ResultDisplay from '@/components/ResultDisplay';
import UsageDashboard from '@/components/UsageDashboard';

const STEP_TITLES: Record<WorkflowStep, string> = {
  'upload-model': 'Step 1: Upload Model Image',
  'select-garments': 'Step 2: Select Garments to Replace',
  'upload-fabrics': 'Step 3: Choose Fabric Designs',
  'advanced-options': 'Step 4: Advanced Options',
  'review': 'Step 5: Review & Generate',
  'generating': 'Generating...',
  'result': 'Your Result',
};

const STEP_ORDER: WorkflowStep[] = [
  'upload-model',
  'select-garments',
  'upload-fabrics',
  'advanced-options',
  'review',
];

export default function HomePage() {
  const workflow = useWorkflow();
  const { state } = workflow;

  // ─── Navigation Helpers ───

  const currentIndex = STEP_ORDER.indexOf(state.currentStep);

  const goNext = useCallback(() => {
    if (currentIndex < STEP_ORDER.length - 1) {
      workflow.goToStep(STEP_ORDER[currentIndex + 1]);
    }
  }, [currentIndex, workflow]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      workflow.goToStep(STEP_ORDER[currentIndex - 1]);
    }
  }, [currentIndex, workflow]);

  // ─── Generation ───

  const handleGenerate = useCallback(async () => {
    workflow.startGeneration();

    try {
      // Build the prompt
      const prompt = buildFinalPrompt(
        state.garmentSelections,
        state.fabricSelections,
        state.advancedOptions.customPrompt
      );

      // Prepare form data for the API
      const formData = new FormData();
      formData.append('prompt', prompt);

      if (state.modelImage) {
        formData.append('modelImage', state.modelImage);
      }

      // Add fabric images
      for (const [garment, fabric] of Object.entries(state.fabricSelections)) {
        if (fabric) {
          if (fabric.type === 'image') {
            formData.append(`fabric_${garment}`, fabric.file);
          } else {
            // For PDF sources, convert the preview URL to a blob
            const response = await fetch(fabric.croppedUrl || fabric.pagePreviewUrl);
            const blob = await response.blob();
            formData.append(`fabric_${garment}`, blob, `${garment}_fabric.png`);
          }
        }
      }

      // Call the API
      console.log('[Generate] Sending request to /api/generate...');
      const res = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      console.log('[Generate] Response status:', res.status, 'data:', data);

      if (!res.ok) {
        const errorMsg = data?.error || `Generation failed (HTTP ${res.status}). Please try again.`;
        throw new Error(errorMsg);
      }

      // Add design number overlay if needed
      let imageWithNumberUrl = data.imageUrl;
      const dnConfig = state.advancedOptions.designNumber;

      if (dnConfig.enabled) {
        const number = dnConfig.number || generateAutoDesignNumber(state.autoDesignCounter);
        const text = formatDesignNumber(number, dnConfig.format, dnConfig.customFormat);
        try {
          imageWithNumberUrl = await addDesignNumberOverlay(
            data.imageUrl,
            text,
            dnConfig.position,
            dnConfig.style,
            dnConfig.fontSize
          );
        } catch {
          // Fall back to image without number
          imageWithNumberUrl = data.imageUrl;
        }
      }

      const result: GenerationResult = {
        imageUrl: data.imageUrl,
        imageWithNumberUrl,
        designNumber: dnConfig.enabled
          ? formatDesignNumber(
            dnConfig.number || generateAutoDesignNumber(state.autoDesignCounter),
            dnConfig.format,
            dnConfig.customFormat
          )
          : undefined,
        timestamp: Date.now(),
        qualityFlags: data.qualityFlags || [],
      };

      workflow.setGenerationResult(result);
    } catch (err) {
      workflow.setError(err instanceof Error ? err.message : 'An error occurred during generation.');
      workflow.goToStep('review');
    }
  }, [workflow, state]);

  // ─── Render Step Content ───

  const renderStepContent = () => {
    switch (state.currentStep) {
      case 'upload-model':
        return (
          <ModelUpload
            modelPreviewUrl={state.modelPreviewUrl}
            onUpload={workflow.setModelImage}
            onClear={workflow.clearModelImage}
          />
        );

      case 'select-garments':
        return (
          <GarmentSelection
            selections={state.garmentSelections}
            onToggle={workflow.toggleGarment}
          />
        );

      case 'upload-fabrics':
        return (
          <FabricUploadPanel
            garments={state.garmentSelections}
            fabrics={state.fabricSelections}
            onFabricSelect={workflow.setFabric}
            onFabricClear={workflow.clearFabric}
          />
        );

      case 'advanced-options':
        return (
          <AdvancedOptions
            options={state.advancedOptions}
            autoDesignCounter={state.autoDesignCounter}
            onChange={workflow.setAdvancedOptions}
          />
        );

      case 'review':
        return state.modelPreviewUrl ? (
          <GenerationSummary
            modelPreviewUrl={state.modelPreviewUrl}
            garments={state.garmentSelections}
            fabrics={state.fabricSelections}
            advancedOptions={state.advancedOptions}
            autoDesignCounter={state.autoDesignCounter}
            onEdit={() => workflow.goToStep('upload-fabrics')}
            onGenerate={handleGenerate}
            isGenerating={state.isGenerating}
          />
        ) : null;

      case 'generating':
        return <GeneratingOverlay estimatedTime={getEstimatedTime(state.garmentSelections)} />;

      case 'result':
        return state.generationResult && state.modelPreviewUrl ? (
          <ResultDisplay
            result={state.generationResult}
            modelPreviewUrl={state.modelPreviewUrl}
            garments={state.garmentSelections}
            fabrics={state.fabricSelections}
            advancedOptions={state.advancedOptions}
            autoDesignCounter={state.autoDesignCounter}
            onRegenerate={() => {
              workflow.resetToStep('review');
            }}
            onStartOver={workflow.resetWorkflow}
          />
        ) : null;

      default:
        return null;
    }
  };

  // ─── Render ───

  const isOnWorkflowStep = STEP_ORDER.includes(state.currentStep);
  const canGoNext = workflow.canProceed(state.currentStep);

  return (
    <div className="pb-20">
      {/* Progress indicator */}
      <ProgressIndicator currentStep={state.currentStep} />

      {/* Step title */}
      {state.currentStep !== 'generating' && state.currentStep !== 'result' && (
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {STEP_TITLES[state.currentStep]}
          </h2>
        </div>
      )}

      {/* Error display */}
      {state.error && (
        <div className="max-w-lg mx-auto mb-6 px-4 py-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
          {state.error}
        </div>
      )}

      {/* Step content */}
      {renderStepContent()}

      {/* Navigation buttons */}
      {isOnWorkflowStep && state.currentStep !== 'review' && (
        <div className="flex items-center justify-between max-w-2xl mx-auto mt-8">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="btn-secondary disabled:invisible"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </button>

          <button
            onClick={goNext}
            disabled={!canGoNext}
            className="btn-primary"
          >
            {state.currentStep === 'advanced-options' ? 'Review & Generate' : 'Continue'}
            <ArrowRight size={16} className="ml-2" />
          </button>
        </div>
      )}

      {/* Usage Dashboard — floating bottom-right */}
      <UsageDashboard />
    </div>
  );
}
