// ─── Core Application Types ───

export type GarmentType = 'top' | 'bottom' | 'chunni';

export type FabricSourceType = 'image' | 'pdf';

export type DesignNumberFormat = 'DES-XXXX' | 'D-XXXX' | 'XXXX' | 'custom';

export type DesignNumberPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export type DesignNumberStyle = 'white-on-dark' | 'black-on-light';

export type WorkflowStep =
  | 'upload-model'
  | 'select-garments'
  | 'upload-fabrics'
  | 'advanced-options'
  | 'review'
  | 'generating'
  | 'result';

// ─── Fabric Source ───

export interface FabricFromImage {
  type: 'image';
  file: File;
  previewUrl: string;
  fileName: string;
}

export interface FabricFromPdf {
  type: 'pdf';
  file: File;
  fileName: string;
  selectedPage: number;
  pagePreviewUrl: string;
  croppedUrl?: string; // If user cropped a region
  totalPages: number;
}

export type FabricSource = FabricFromImage | FabricFromPdf;

// ─── Garment Selection ───

export interface GarmentSelections {
  top: boolean;
  bottom: boolean;
  chunni: boolean;
}

export interface FabricSelections {
  top?: FabricSource;
  bottom?: FabricSource;
  chunni?: FabricSource;
}

// ─── Design Number Options ───

export interface DesignNumberConfig {
  enabled: boolean;
  number: string;
  format: DesignNumberFormat;
  customFormat: string;
  position: DesignNumberPosition;
  style: DesignNumberStyle;
  fontSize: 'small' | 'medium' | 'large';
}

// ─── Advanced Options ───

export interface AdvancedOptions {
  customPrompt: string;
  designNumber: DesignNumberConfig;
}

// ─── PDF Page Data ───

export interface PdfPageData {
  pageNumber: number;
  thumbnailUrl: string;
  width: number;
  height: number;
}

// ─── Crop Region ───

export interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ─── Generation Result ───

export interface GenerationResult {
  imageUrl: string;
  imageWithNumberUrl?: string;
  designNumber?: string;
  timestamp: number;
  qualityFlags: QualityFlag[];
}

export interface QualityFlag {
  type: 'geometry-changed' | 'border-shifted' | 'fabric-bleed' | 'text-interference' | 'prompt-drift';
  message: string;
  severity: 'warning' | 'error';
}

// ─── Prompt Warning ───

export interface PromptWarning {
  keyword: string;
  message: string;
  severity: 'blocked' | 'warning';
}

// ─── Workflow State ───

export interface WorkflowState {
  currentStep: WorkflowStep;
  modelImage: File | null;
  modelPreviewUrl: string | null;
  garmentSelections: GarmentSelections;
  fabricSelections: FabricSelections;
  advancedOptions: AdvancedOptions;
  generationResult: GenerationResult | null;
  isGenerating: boolean;
  error: string | null;
  autoDesignCounter: number;
}

// ─── Default Values ───

export const DEFAULT_DESIGN_NUMBER_CONFIG: DesignNumberConfig = {
  enabled: false,
  number: '',
  format: 'DES-XXXX',
  customFormat: '',
  position: 'top-right',
  style: 'white-on-dark',
  fontSize: 'small',
};

export const DEFAULT_ADVANCED_OPTIONS: AdvancedOptions = {
  customPrompt: '',
  designNumber: { ...DEFAULT_DESIGN_NUMBER_CONFIG },
};

export const DEFAULT_GARMENT_SELECTIONS: GarmentSelections = {
  top: false,
  bottom: false,
  chunni: false,
};

export const INITIAL_WORKFLOW_STATE: WorkflowState = {
  currentStep: 'upload-model',
  modelImage: null,
  modelPreviewUrl: null,
  garmentSelections: { ...DEFAULT_GARMENT_SELECTIONS },
  fabricSelections: {},
  advancedOptions: { ...DEFAULT_ADVANCED_OPTIONS },
  generationResult: null,
  isGenerating: false,
  error: null,
  autoDesignCounter: 1,
};
