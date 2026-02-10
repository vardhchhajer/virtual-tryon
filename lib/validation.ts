import type { PromptWarning } from './types';

// ─── Blocked keywords that would modify garment geometry ───

const BLOCKED_KEYWORDS = [
  'redesign', 'reshape', 'change silhouette', 'make longer', 'make shorter',
  'different neckline', 'alter sleeves', 'different style', 'modern style',
  'western style', 'replace with', 'swap to', 'change to different',
  'change neckline', 'lengthen', 'shorten', 'resize', 'restructure',
  'add sleeves', 'remove sleeves', 'change collar', 'add collar',
];

// ─── Warning keywords that might cause drift ───

const WARNING_KEYWORDS = [
  'change', 'modify', 'alter', 'different', 'transform', 'convert',
  'restyle', 'remodel', 'adjust shape', 'wider', 'narrower', 'tighter',
  'looser', 'bigger', 'smaller',
];

// ─── Allowed keywords (safe for texture/color only) ───

const ALLOWED_KEYWORDS = [
  'brighter', 'darker', 'vibrant', 'warmer', 'cooler', 'shimmer',
  'matte', 'sheen', 'softer', 'contrast', 'shadow', 'highlight',
  'flowing', 'lighter fabric', 'transparency', 'sheer', 'golden',
  'silver', 'metallic', 'embroidery', 'texture', 'color', 'tone',
  'saturation', 'luminous', 'glossy', 'silk', 'satin',
];

export function validateCustomPrompt(prompt: string): PromptWarning[] {
  const warnings: PromptWarning[] = [];
  const lower = prompt.toLowerCase();

  // Check for blocked keywords
  for (const keyword of BLOCKED_KEYWORDS) {
    if (lower.includes(keyword)) {
      warnings.push({
        keyword,
        message: `Your prompt contains "${keyword}" which may override geometry preservation rules. Consider rewording to focus on texture/color only.`,
        severity: 'blocked',
      });
    }
  }

  // Check for warning keywords (only if not already blocked)
  for (const keyword of WARNING_KEYWORDS) {
    if (lower.includes(keyword)) {
      const alreadyBlocked = warnings.some(w => w.severity === 'blocked' && lower.indexOf(w.keyword) === lower.indexOf(keyword));
      if (!alreadyBlocked) {
        warnings.push({
          keyword,
          message: `"${keyword}" may cause unintended changes. Ensure it refers to color/texture, not geometry.`,
          severity: 'warning',
        });
      }
    }
  }

  return warnings;
}

// ─── Sanitize prompt for injection attempts ───

export function sanitizePrompt(prompt: string): string {
  // Remove potential injection patterns
  let sanitized = prompt
    .replace(/<[^>]*>/g, '') // HTML tags
    .replace(/\{[^}]*\}/g, '') // Template literals
    .replace(/\$\{[^}]*\}/g, '') // JS template literals
    .replace(/javascript:/gi, '') // JS protocol
    .replace(/on\w+\s*=/gi, '') // Event handlers
    .replace(/\\/g, '') // Backslashes
    .trim();

  // Limit length
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 500);
  }

  return sanitized;
}

// ─── Design number validation ───

const DESIGN_NUMBER_ALLOWED = /^[A-Za-z0-9\-_ ]+$/;
const DESIGN_NUMBER_BLOCKED = /[<>{}()\[\]@#$%^&*+=|\\/"'`;:!?~]/;

export function validateDesignNumber(value: string): { valid: boolean; error?: string } {
  if (!value || value.trim().length === 0) {
    return { valid: false, error: 'Design number cannot be empty.' };
  }

  if (value.length > 15) {
    return { valid: false, error: 'Maximum 15 characters allowed.' };
  }

  if (DESIGN_NUMBER_BLOCKED.test(value)) {
    return { valid: false, error: 'Special characters are not allowed.' };
  }

  if (!DESIGN_NUMBER_ALLOWED.test(value)) {
    return { valid: false, error: 'Only letters, numbers, hyphens, and underscores allowed.' };
  }

  return { valid: true };
}

// ─── Format design number ───

export function formatDesignNumber(
  number: string,
  format: string,
  customFormat: string
): string {
  const num = number.replace(/\s+/g, '-');

  switch (format) {
    case 'DES-XXXX':
      return `DES-${num}`;
    case 'D-XXXX':
      return `D-${num}`;
    case 'XXXX':
      return num;
    case 'custom':
      return customFormat ? `${customFormat}${num}` : num;
    default:
      return `DES-${num}`;
  }
}

// ─── Auto-generate design number ───

export function generateAutoDesignNumber(counter: number): string {
  return String(counter).padStart(4, '0');
}

// ─── Validate image file ───

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 20 * 1024 * 1024; // 20MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPG, PNG, and WEBP images are accepted.' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'Image must be under 20MB.' };
  }

  return { valid: true };
}

// ─── Validate PDF file ───

export function validatePdfFile(file: File): { valid: boolean; error?: string } {
  if (file.type !== 'application/pdf') {
    return { valid: false, error: 'Only PDF files are accepted.' };
  }

  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return { valid: false, error: 'PDF must be under 50MB.' };
  }

  return { valid: true };
}
