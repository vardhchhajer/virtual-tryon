'use client';

import { useState, useCallback } from 'react';
import type {
  WorkflowState,
  WorkflowStep,
  GarmentType,
  FabricSource,
  AdvancedOptions,
  GenerationResult,
} from '@/lib/types';
import { INITIAL_WORKFLOW_STATE } from '@/lib/types';

export function useWorkflow() {
  const [state, setState] = useState<WorkflowState>({ ...INITIAL_WORKFLOW_STATE });

  // ─── Navigation ───

  const goToStep = useCallback((step: WorkflowStep) => {
    setState(prev => ({ ...prev, currentStep: step, error: null }));
  }, []);

  const canProceed = useCallback((step: WorkflowStep): boolean => {
    switch (step) {
      case 'upload-model':
        return !!state.modelImage;
      case 'select-garments':
        return state.garmentSelections.top || state.garmentSelections.bottom || state.garmentSelections.chunni;
      case 'upload-fabrics': {
        const sel = state.garmentSelections;
        const fab = state.fabricSelections;
        if (sel.top && !fab.top) return false;
        if (sel.bottom && !fab.bottom) return false;
        if (sel.chunni && !fab.chunni) return false;
        return true;
      }
      case 'advanced-options':
        return true; // always optional
      case 'review':
        return true;
      default:
        return false;
    }
  }, [state]);

  // ─── Model Image ───

  const setModelImage = useCallback((file: File, previewUrl: string) => {
    setState(prev => ({
      ...prev,
      modelImage: file,
      modelPreviewUrl: previewUrl,
      error: null,
    }));
  }, []);

  const clearModelImage = useCallback(() => {
    setState(prev => ({
      ...prev,
      modelImage: null,
      modelPreviewUrl: null,
    }));
  }, []);

  // ─── Garment Selection ───

  const toggleGarment = useCallback((garment: GarmentType) => {
    setState(prev => {
      const newSelections = {
        ...prev.garmentSelections,
        [garment]: !prev.garmentSelections[garment],
      };

      // Clear fabric for deselected garments
      const newFabrics = { ...prev.fabricSelections };
      if (!newSelections[garment]) {
        delete newFabrics[garment];
      }

      return {
        ...prev,
        garmentSelections: newSelections,
        fabricSelections: newFabrics,
      };
    });
  }, []);

  // ─── Fabric Selection ───

  const setFabric = useCallback((garment: GarmentType, source: FabricSource) => {
    setState(prev => ({
      ...prev,
      fabricSelections: {
        ...prev.fabricSelections,
        [garment]: source,
      },
    }));
  }, []);

  const clearFabric = useCallback((garment: GarmentType) => {
    setState(prev => {
      const newFabrics = { ...prev.fabricSelections };
      delete newFabrics[garment];
      return { ...prev, fabricSelections: newFabrics };
    });
  }, []);

  // ─── Advanced Options ───

  const setAdvancedOptions = useCallback((options: Partial<AdvancedOptions>) => {
    setState(prev => ({
      ...prev,
      advancedOptions: {
        ...prev.advancedOptions,
        ...options,
      },
    }));
  }, []);

  // ─── Generation ───

  const startGeneration = useCallback(() => {
    setState(prev => ({
      ...prev,
      isGenerating: true,
      currentStep: 'generating',
      error: null,
    }));
  }, []);

  const setGenerationResult = useCallback((result: GenerationResult) => {
    setState(prev => ({
      ...prev,
      isGenerating: false,
      generationResult: result,
      currentStep: 'result',
      autoDesignCounter: prev.autoDesignCounter + 1,
    }));
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      isGenerating: false,
      error,
    }));
  }, []);

  // ─── Reset ───

  const resetWorkflow = useCallback(() => {
    setState({ ...INITIAL_WORKFLOW_STATE });
  }, []);

  const resetToStep = useCallback((step: WorkflowStep) => {
    setState(prev => ({
      ...prev,
      currentStep: step,
      generationResult: null,
      isGenerating: false,
      error: null,
    }));
  }, []);

  return {
    state,
    goToStep,
    canProceed,
    setModelImage,
    clearModelImage,
    toggleGarment,
    setFabric,
    clearFabric,
    setAdvancedOptions,
    startGeneration,
    setGenerationResult,
    setError,
    resetWorkflow,
    resetToStep,
  };
}
