import type { GarmentSelections, FabricSelections, FabricSource } from './types';
import { sanitizePrompt } from './validation';

// ─── Base prompt templates per garment combination ───

const BASE_PROMPTS: Record<string, string> = {
  // Single garment
  'top': `Use the uploaded model image as the fixed base image.
Perform texture replacement ONLY on the kurti/top garment.
Apply the provided fabric design strictly to the existing top garment pixels.

Preserve exactly:
– All garment geometry, seams, folds, drape direction
– Existing shadow placement and lighting
– All other garments remain 100% unchanged
– Model pose, background, accessories untouched`,

  'bottom': `Use the uploaded model image as the fixed base image.
Perform texture replacement ONLY on the salwar/bottom garment.
Apply the provided fabric design strictly to the existing bottom garment pixels.

Preserve exactly:
– All garment geometry, seams, folds, drape direction
– Existing shadow placement and lighting
– All other garments remain 100% unchanged
– Model pose, background, accessories untouched`,

  'chunni': `Use the uploaded model image as the fixed base image.
Perform texture replacement ONLY on the chunni/dupatta.
Apply the provided fabric design strictly to the existing chunni pixels.

Preserve exactly:
– All garment geometry including border placement and transparency
– Existing shadow placement and drape behavior
– All other garments remain 100% unchanged
– Model pose, background, accessories untouched

CRITICAL: Chunni border position must remain exactly as in the original.`,

  // Dual garments
  'top+bottom': `Use the uploaded model image as the fixed base image.
Perform texture replacement on:
– Kurti/top → TOP fabric
– Bottom/salwar → BOTTOM fabric

Apply each fabric strictly to its corresponding existing garment pixels.

Preserve exactly:
– All garment geometry, folds, drape, seams, shadows
– Chunni/dupatta remains 100% unchanged
– Model pose, background, accessories untouched`,

  'top+chunni': `Use the uploaded model image as the fixed base image.
Perform texture replacement on:
– Kurti/top → TOP fabric
– Chunni/dupatta → CHUNNI fabric

Apply each fabric strictly to its corresponding existing garment pixels.

Preserve exactly:
– All garment geometry, folds, drape, seams, shadows
– Bottom/salwar remains 100% unchanged
– Chunni border placement and transparency preserved
– Model pose, background, accessories untouched`,

  'bottom+chunni': `Use the uploaded model image as the fixed base image.
Perform texture replacement on:
– Bottom/salwar → BOTTOM fabric
– Chunni/dupatta → CHUNNI fabric

Apply each fabric strictly to its corresponding existing garment pixels.

Preserve exactly:
– All garment geometry, folds, drape, seams, shadows
– Kurti/top remains 100% unchanged
– Chunni border placement and transparency preserved
– Model pose, background, accessories untouched`,

  // All three
  'top+bottom+chunni': `Use the uploaded model image as the fixed base image.
Perform texture replacement on:
– Kurti/top → TOP fabric
– Bottom/salwar → BOTTOM fabric
– Chunni/dupatta → CHUNNI fabric

Apply each fabric strictly to its corresponding existing garment pixels.

Preserve exactly:
– All garment geometry
– Folds, drape, seams, shadows
– Chunni border placement and transparency

CRITICAL: Each fabric must only affect its designated garment area.`,
};

// ─── Negative prompts ───

const NEGATIVE_PROMPT = `Hard locks:
– Do NOT change pose, model, background, inset, lighting, accessories
– No fabric mixing or redesign
– No garment bleeding across boundaries

Negative:
No silhouette change, no stiffness, no pasted look, no redesign, no pasted texture, no fabric bleeding, no geometry modification, no shape alteration

Enforcement:
If any garment geometry changes, regenerate and apply textures strictly to existing pixels only.`;

// ─── Build garment combination key ───

function getGarmentKey(garments: GarmentSelections): string {
  const parts: string[] = [];
  if (garments.top) parts.push('top');
  if (garments.bottom) parts.push('bottom');
  if (garments.chunni) parts.push('chunni');
  return parts.join('+');
}

// ─── Describe fabric source ───

function describeFabricSource(source: FabricSource): string {
  if (source.type === 'image') {
    return `Direct image: ${source.fileName}`;
  }
  return `PDF: ${source.fileName} (Page ${source.selectedPage})${source.croppedUrl ? ' [cropped]' : ''}`;
}

// ─── Build final prompt ───

export function buildFinalPrompt(
  garments: GarmentSelections,
  fabrics: FabricSelections,
  customPrompt: string
): string {
  const key = getGarmentKey(garments);
  const basePrompt = BASE_PROMPTS[key] || BASE_PROMPTS['top+bottom+chunni'];

  // Build source descriptions
  const sourceLines: string[] = [];
  if (garments.top && fabrics.top) {
    sourceLines.push(`TOP fabric source: ${describeFabricSource(fabrics.top)}`);
  }
  if (garments.bottom && fabrics.bottom) {
    sourceLines.push(`BOTTOM fabric source: ${describeFabricSource(fabrics.bottom)}`);
  }
  if (garments.chunni && fabrics.chunni) {
    sourceLines.push(`CHUNNI fabric source: ${describeFabricSource(fabrics.chunni)}`);
  }

  // Assemble
  let prompt = basePrompt;

  if (sourceLines.length > 0) {
    prompt += '\n\nFabric sources:\n' + sourceLines.join('\n');
  }

  // Custom prompt injection (sanitized)
  if (customPrompt.trim()) {
    const sanitized = sanitizePrompt(customPrompt);
    prompt += `\n\nAdditional instructions:\n${sanitized}`;
  }

  prompt += `\n\n${NEGATIVE_PROMPT}`;

  return prompt;
}

// ─── Get estimated generation time based on garment count ───

export function getEstimatedTime(garments: GarmentSelections): string {
  const count = [garments.top, garments.bottom, garments.chunni].filter(Boolean).length;
  if (count === 1) return '30-45 seconds';
  if (count === 2) return '45-60 seconds';
  return '60-90 seconds';
}
