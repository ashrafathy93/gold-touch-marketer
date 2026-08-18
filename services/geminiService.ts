import { GoogleGenAI, Modality, Type, Part } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ANALYSIS_MODEL = 'gemini-2.5-flash';
const IMAGE_MODEL = 'gemini-2.5-flash-image';

export interface ImageFile {
  data: string;
  mimeType: string;
}

export type ImageCategory = 'sketch' | 'product' | 'unrelated';

export interface AnalysisResult {
  category: ImageCategory;
  reason: string;
}

export interface GenerationResult {
  resultImage: string;
  category: ImageCategory;
}

/**
 * Step 1: Analyze the uploaded image to understand what the user uploaded.
 * - "sketch": a hand-drawn / hand-sketched design of a gold piece (ring, necklace, bracelet, etc.)
 * - "product": an actual photo of a real, manufactured gold product
 * - "unrelated": anything that is not a gold product or a sketch of one (this app is gold-only)
 */
export const analyzeImage = async (image: ImageFile): Promise<AnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: {
        parts: [
          { inlineData: { data: image.data, mimeType: image.mimeType } },
          {
            text: `You are an intake classifier for an app that ONLY does commercial photography/marketing enhancement for GOLD products (rings, necklaces, bracelets, earrings, gold bars/coins, gold accessories, etc.).

Look at the attached image and classify it into exactly one category:
- "sketch": A hand-drawn / hand-sketched / pencil or pen drawing, a rough digital doodle, or a 2D design concept of a gold jewelry/gold product. It is NOT a photograph of a real, physical object.
- "product": An actual photograph (phone photo, studio photo, or any real-world image) of a real, physical gold product (jewelry, gold bar, gold coin, gold ornament, etc.), even if the photo quality, lighting, or background is poor.
- "unrelated": The image is not a sketch or photo of a gold product at all (e.g. a person, a random object, silver/other non-gold item that is clearly not gold, food, landscape, screenshot, text document, etc.) OR you cannot reasonably tell it is gold-related.

Respond with strict JSON only.`,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              enum: ['sketch', 'product', 'unrelated'],
            },
            reason: {
              type: Type.STRING,
              description: 'One short sentence explaining the classification.',
            },
          },
          required: ['category', 'reason'],
        },
      },
    });

    const raw = response.text?.trim();
    if (!raw) {
      throw new Error('EMPTY_ANALYSIS');
    }
    const parsed = JSON.parse(raw) as AnalysisResult;
    if (!['sketch', 'product', 'unrelated'].includes(parsed.category)) {
      throw new Error('INVALID_CATEGORY');
    }
    return parsed;
  } catch (e) {
    console.error('Analysis failed', e);
    // Fail safe: if we can't classify, treat as a product photo (the safer, less destructive path).
    return { category: 'product', reason: 'Fallback: could not classify, defaulting to product enhancement.' };
  }
};

const SKETCH_TO_PRODUCT_PROMPT = `**Role:** You are an elite luxury jewelry CGI artist and commercial product photographer specializing exclusively in GOLD products.

**Task:** The attached image is a hand-drawn sketch / rough design concept of a gold jewelry piece. Transform it into a single, hyper-realistic photograph of the ACTUAL, physically manufactured gold product that this sketch describes.

**Requirements:**
1. Faithfully interpret the sketch's shape, structure, proportions, and any indicated stones or engravings, and render them as a real, finely crafted, physical gold object — as if a master goldsmith had already made it.
2. Use rich, believable gold material properties: correct metallic reflections, warm gold tone, realistic specular highlights, and micro-detail (brushed/polished finish as appropriate).
3. Photograph it as a premium e-commerce "hero" shot: place the product on an elegant, creative, tasteful shopping/marketing background (soft studio gradients, luxury fabric, subtle reflective surface, or a refined lifestyle set) with professional three-point studio lighting, shallow depth of field where appropriate, and flattering angle that shows off the craftsmanship.
4. Add a tasteful creative touch to elevate the marketing appeal (mood lighting, subtle bokeh, elegant composition) without turning it into a cluttered or gimmicky scene. The gold product must remain the undeniable focal point, tack-sharp and perfectly in focus.
5. Do NOT include any text, watermark, logo, or human body parts unless the sketch explicitly depicts the item being worn.
6. Output must be a single, ultra-high-resolution, photorealistic square image suitable for a premium jewelry website or online store listing.`;

const PRODUCT_ENHANCE_PROMPT = `**Role:** You are an elite luxury jewelry retoucher and commercial product photographer specializing exclusively in GOLD products.

**Task:** The attached image is a real photo of an actual gold product. Produce a single, retouched, e-commerce-ready "hero" shot of this EXACT same product.

**Requirements:**
1. Carefully isolate/extract the gold product from its current background. Do NOT alter, redesign, add, or remove any part of the product itself — same shape, same stones, same engravings, same proportions. This is retouching, not redesign.
2. Dramatically improve image quality: increase sharpness and clarity, remove noise/grain/blur, correct exposure and white balance, and enhance the gold's natural luster, warmth, and metallic reflections so it looks premium and true-to-life.
3. Replace the background with a brand-new, creative, elegant shopping/marketing background that best flatters this specific piece (choose from: soft luxury studio gradient, fine fabric/velvet surface, subtle reflective glass/marble surface, or a refined minimal lifestyle set) with professional studio lighting and soft shadows/reflection grounding the product naturally.
4. Center and frame the product attractively, tack-sharp and in perfect focus, as the clear hero of the image.
5. Do NOT add any text, watermark, or logo.
6. Output must be a single, ultra-high-resolution, photorealistic square image suitable for a premium jewelry website or online store listing.`;

const processResponseToImage = (response: any): string | null => {
  const parts = response?.candidates?.[0]?.content?.parts;
  if (!parts) return null;
  for (const part of parts) {
    if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  return null;
};

/**
 * Full pipeline: analyze -> route -> generate.
 * The caller never needs to know which internal path was taken.
 */
export const generateShoppingImage = async (
  image: ImageFile,
  setLoadingMessage: (message: string) => void
): Promise<GenerationResult> => {
  try {
    setLoadingMessage('جاري تحليل الصورة...');
    const analysis = await analyzeImage(image);

    if (analysis.category === 'unrelated') {
      throw new Error(
        'هذا التطبيق متخصص فقط في تسويق المنتجات الذهبية. الرجاء رفع صورة سكتش لتصميم ذهبي أو صورة لمنتج ذهبي فعلي.'
      );
    }

    setLoadingMessage(
      analysis.category === 'sketch'
        ? 'جاري تحويل التصميم إلى منتج ذهبي واقعي...'
        : 'جاري تحسين جودة المنتج وصناعة خلفية تسويقية إبداعية...'
    );

    const prompt = analysis.category === 'sketch' ? SKETCH_TO_PRODUCT_PROMPT : PRODUCT_ENHANCE_PROMPT;

    const contents: Part[] = [
      { inlineData: { data: image.data, mimeType: image.mimeType } },
      { text: prompt },
    ];

    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: { parts: contents },
      config: { responseModalities: [Modality.IMAGE] },
    });

    const resultImage = processResponseToImage(response);
    if (!resultImage) {
      throw new Error('لم يتمكن الذكاء الاصطناعي من إنشاء الصورة. الرجاء تجربة صورة أخرى.');
    }

    setLoadingMessage('اللمسات الأخيرة...');

    return { resultImage, category: analysis.category };
  } catch (e) {
    console.error(e);
    if (e instanceof Error) {
      if (e.message.includes('API_KEY') || e.message.includes('API key')) {
        throw new Error('لم يتم إعداد مفتاح الذكاء الاصطناعي بشكل صحيح. الرجاء التحقق من إعدادات التطبيق.');
      }
      if (e.message.includes('429') || e.message.toLowerCase().includes('resource exhausted') || e.message.toLowerCase().includes('quota')) {
        throw new Error('تم استهلاك الحصة المجانية المتاحة لليوم، أو الخدمة مشغولة حالياً. الرجاء المحاولة مرة أخرى بعد قليل.');
      }
      throw new Error(e.message);
    }
    throw new Error('حدث خطأ غير متوقع أثناء إنشاء الصورة. الرجاء المحاولة مرة أخرى.');
  }
};
