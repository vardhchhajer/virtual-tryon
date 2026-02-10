/**
 * Server-side usage tracker for Gemini API calls.
 * Persists all records to a local JSON file so data survives server restarts.
 *
 * Pricing based on Gemini 3 Pro Image Preview:
 *   Input:  $1.25 / 1M tokens (text), $0.0032 / image
 *   Output: $5.00 / 1M tokens (text), $0.0320 / image
 *   (Pricing may vary — update PRICING constants as needed)
 */

import * as fs from 'fs';
import * as path from 'path';

export interface GenerationRecord {
  id: string;
  timestamp: number;
  inputTokens: number;
  outputTokens: number;
  inputImages: number;
  outputImages: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  model: string;
  success: boolean;
}

interface PersistedData {
  records: GenerationRecord[];
  idCounter: number;
  firstGenerationAt: number | null;
}

export interface UsageStats {
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalInputImages: number;
  totalOutputImages: number;
  totalCost: number;
  averageCostPerImage: number;
  averageTokensPerGeneration: number;
  recentGenerations: GenerationRecord[];
  sessionStartedAt: number;
}

// ─── Gemini 3 Pro Image Preview pricing ───
const PRICING = {
  inputTextPerToken: 1.25 / 1_000_000,   // $1.25 per 1M input tokens
  outputTextPerToken: 5.00 / 1_000_000,   // $5.00 per 1M output tokens
  inputImagePerImage: 0.0032,              // $0.0032 per input image
  outputImagePerImage: 0.0320,             // $0.0320 per output image
};

// ─── Persistent file storage ───
const DATA_FILE = path.join(process.cwd(), 'usage-data.json');

function loadData(): PersistedData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw) as PersistedData;
    }
  } catch {
    // If file is corrupted, start fresh
  }
  return { records: [], idCounter: 0, firstGenerationAt: null };
}

function saveData(data: PersistedData): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save usage data:', err);
  }
}

// Load persisted data on module init
let data = loadData();

function generateId(): string {
  data.idCounter++;
  return `gen_${Date.now()}_${data.idCounter}`;
}

/**
 * Calculate cost for a generation call.
 */
function calculateCost(
  inputTokens: number,
  outputTokens: number,
  inputImages: number,
  outputImages: number
) {
  const inputCost =
    inputTokens * PRICING.inputTextPerToken +
    inputImages * PRICING.inputImagePerImage;

  const outputCost =
    outputTokens * PRICING.outputTextPerToken +
    outputImages * PRICING.outputImagePerImage;

  return { inputCost, outputCost, totalCost: inputCost + outputCost };
}

/**
 * Record a generation call's usage.
 */
export function trackGeneration(params: {
  inputTokens: number;
  outputTokens: number;
  inputImages: number;
  outputImages: number;
  model: string;
  success: boolean;
}): GenerationRecord {
  const { inputCost, outputCost, totalCost } = calculateCost(
    params.inputTokens,
    params.outputTokens,
    params.inputImages,
    params.outputImages
  );

  const record: GenerationRecord = {
    id: generateId(),
    timestamp: Date.now(),
    inputTokens: params.inputTokens,
    outputTokens: params.outputTokens,
    inputImages: params.inputImages,
    outputImages: params.outputImages,
    inputCost,
    outputCost,
    totalCost,
    model: params.model,
    success: params.success,
  };

  if (!data.firstGenerationAt) {
    data.firstGenerationAt = Date.now();
  }
  data.records.push(record);
  saveData(data);

  return record;
}

/**
 * Get aggregated usage statistics.
 */
export function getUsageStats(): UsageStats {
  const records = data.records;
  const successful = records.filter(r => r.success);
  const failed = records.filter(r => !r.success);

  const totalInputTokens = records.reduce((s, r) => s + r.inputTokens, 0);
  const totalOutputTokens = records.reduce((s, r) => s + r.outputTokens, 0);
  const totalCost = records.reduce((s, r) => s + r.totalCost, 0);
  const totalOutputImages = records.reduce((s, r) => s + r.outputImages, 0);

  return {
    totalGenerations: records.length,
    successfulGenerations: successful.length,
    failedGenerations: failed.length,
    totalInputTokens,
    totalOutputTokens,
    totalTokens: totalInputTokens + totalOutputTokens,
    totalInputImages: records.reduce((s, r) => s + r.inputImages, 0),
    totalOutputImages,
    totalCost,
    averageCostPerImage: totalOutputImages > 0 ? totalCost / totalOutputImages : 0,
    averageTokensPerGeneration:
      records.length > 0
        ? (totalInputTokens + totalOutputTokens) / records.length
        : 0,
    recentGenerations: records.slice(-20).reverse(),
    sessionStartedAt: data.firstGenerationAt ?? Date.now(),
  };
}

/**
 * Reset all usage data (also deletes the file).
 */
export function resetUsageStats(): void {
  data = { records: [], idCounter: 0, firstGenerationAt: null };
  try {
    if (fs.existsSync(DATA_FILE)) {
      fs.unlinkSync(DATA_FILE);
    }
  } catch {
    // ignore
  }
}
