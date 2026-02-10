import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { trackGeneration } from '@/lib/usageTracker';

/**
 * POST /api/generate
 *
 * Uses Nano Banana Pro (Gemini 3 Pro Image Preview) for virtual try-on
 * image generation. Sends model photo + fabric images + prompt and
 * receives an AI-edited image with the fabrics applied.
 *
 * Features: Up to 14 reference images, 2K output, advanced thinking mode
 *
 * Requires GOOGLE_API_KEY in .env.local (from Google Cloud Console)
 */

// ─── Helper: Convert File to base64 inline_data part ───
async function fileToInlineData(file: File) {
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');
  return {
    inlineData: {
      data: base64,
      mimeType: file.type || 'image/jpeg',
    },
  };
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    console.log('[API/generate] Request received. API key present:', !!apiKey, 'Key prefix:', apiKey?.substring(0, 8) + '...');

    if (!apiKey) {
      console.error('[API/generate] GOOGLE_API_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'GOOGLE_API_KEY not configured. Set it as an environment variable in Cloud Run.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const modelImage = formData.get('modelImage') as File | null;

    console.log('[API/generate] Prompt length:', prompt?.length, 'Model image:', modelImage?.name, 'Size:', modelImage?.size);

    if (!prompt) {
      return NextResponse.json(
        { error: 'No prompt provided' },
        { status: 400 }
      );
    }

    if (!modelImage) {
      return NextResponse.json(
        { error: 'No model image provided' },
        { status: 400 }
      );
    }

    // Collect fabric files
    const fabricFiles: File[] = [];
    for (const key of ['fabric_top', 'fabric_bottom', 'fabric_chunni']) {
      const file = formData.get(key) as File | null;
      if (file) {
        fabricFiles.push(file);
      }
    }

    // ─── Build Nano Banana Pro request contents ───
    // Contents array: [prompt_text, model_image, ...fabric_images]
    // Gemini 3 Pro Image supports up to 14 reference images (5 high-fidelity)
    const modelImagePart = await fileToInlineData(modelImage);

    const fabricParts = await Promise.all(
      fabricFiles.map(f => fileToInlineData(f))
    );

    // Assemble contents — text prompt + model photo + fabric reference images
    const contents = [
      prompt,
      modelImagePart,
      ...fabricParts,
    ];

    // ─── Call Nano Banana Pro (Gemini 3 Pro Image Preview) ───
    const ai = new GoogleGenAI({ apiKey });

    console.log('[API/generate] Calling Gemini model with', contents.length, 'content parts...');

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          // 4:5 portrait aspect for fashion/garment photos
          aspectRatio: '4:5',
          // 2K resolution for high-quality garment detail
          imageSize: '2K',
        },
      },
    });

    console.log('[API/generate] Gemini response received. Candidates:', response.candidates?.length, 'Usage:', JSON.stringify(response.usageMetadata));

    // ─── Extract generated image from response ───
    let imageUrl: string | null = null;
    let responseText = '';
    const qualityFlags: string[] = [];

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        // Skip thought parts (interim images from thinking process)
        if ((part as Record<string, unknown>).thought) continue;

        if (part.text) {
          responseText += part.text;
        } else if (part.inlineData) {
          // Convert the generated image to a data URL
          const mimeType = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    if (!imageUrl) {
      // If no image was returned, add quality flag and fall back
      qualityFlags.push('no-image-generated');

      // Fallback: return the original model image
      const fallbackBytes = await modelImage.arrayBuffer();
      const fallbackBase64 = Buffer.from(fallbackBytes).toString('base64');
      const fallbackMime = modelImage.type || 'image/jpeg';
      imageUrl = `data:${fallbackMime};base64,${fallbackBase64}`;

      qualityFlags.push(
        responseText
          ? `Model response: ${responseText.substring(0, 200)}`
          : 'No response from model'
      );
    }

    // ─── Track usage from response metadata ───
    const usageMetadata = response.usageMetadata;
    const inputTokens = usageMetadata?.promptTokenCount ?? 0;
    const outputTokens = usageMetadata?.candidatesTokenCount ?? 0;
    const inputImageCount = 1 + fabricFiles.length; // model + fabrics
    const outputImageCount = imageUrl && !qualityFlags.includes('no-image-generated') ? 1 : 0;

    const usageRecord = trackGeneration({
      inputTokens,
      outputTokens,
      inputImages: inputImageCount,
      outputImages: outputImageCount,
      model: 'gemini-3-pro-image-preview',
      success: outputImageCount > 0,
    });

    return NextResponse.json({
      imageUrl,
      prompt: prompt.substring(0, 200) + '...',
      qualityFlags,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        cost: usageRecord.totalCost,
      },
      metadata: {
        fabricCount: fabricFiles.length,
        generatedAt: new Date().toISOString(),
        model: 'gemini-3-pro-image-preview',
        modelResponse: responseText.substring(0, 500) || undefined,
      },
    });
  } catch (error) {
    console.error('Nano Banana generation error:', error);

    const message =
      error instanceof Error ? error.message : 'Unknown error';

    // Provide helpful error messages for common issues
    if (message.includes('API_KEY')) {
      return NextResponse.json(
        { error: 'Invalid API key. Check your GOOGLE_API_KEY in .env.local' },
        { status: 401 }
      );
    }
    if (message.includes('SAFETY')) {
      return NextResponse.json(
        { error: 'Image was blocked by safety filters. Try adjusting your prompt or using a different image.' },
        { status: 422 }
      );
    }
    if (message.includes('RATE_LIMIT') || message.includes('429')) {
      return NextResponse.json(
        { error: 'Rate limit reached. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: `Generation failed: ${message}` },
      { status: 500 }
    );
  }
}
