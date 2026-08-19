import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // السماح بطلبات POST فقط
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!apiKey) {
    return res.status(500).json({
      error:
        'GEMINI_API_KEY غير معرف في Vercel. أضفه من Settings → Environment Variables ثم أعد النشر (Redeploy).',
    });
  }

  try {
    const { action, imageBase64, mimeType, prompt } = req.body || {};

    const rawBase64 =
      typeof imageBase64 === 'string'
        ? imageBase64
        : imageBase64 && typeof imageBase64 === 'object' && typeof imageBase64.data === 'string'
        ? imageBase64.data
        : '';

    if (imageBase64 && typeof rawBase64 !== 'string') {
      return res.status(400).json({
        error: `صيغة الصورة غير متوقعة من الفرونت إند (النوع المستلم: ${typeof imageBase64}).`,
      });
    }

    const cleanBase64 = rawBase64.replace(/^data:image\/\w+;base64,/, '');
    const resolvedMimeType =
      mimeType || (imageBase64 && typeof imageBase64 === 'object' ? imageBase64.mimeType : null) || 'image/jpeg';

    // 1. تحليل وفحص الصورة (استخدام gemini-3.5-flash للتوفير والأداء العالي)
    if (action === 'analyze') {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: [
            { inlineData: { data: cleanBase64, mimeType: resolvedMimeType } },
            { text: prompt || 'قم بتحليل تصميم هذه المجوهرات واستخراج وصف دقيق.' },
          ],
        });
        return res.status(200).json({ result: response.text });
      } catch (analyzeError: any) {
        // نموذج احتياطي في حالة حدوث إجهاد للكوتا (Fallback)
        const fallbackResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            { inlineData: { data: cleanBase64, mimeType: resolvedMimeType } },
            { text: prompt || 'قم بتحليل تصميم هذه المجوهرات واستخراج وصف دقيق.' },
          ],
        });
        return res.status(200).json({ result: fallbackResponse.text });
      }
    }

    // 2. توليد صورة تسويقية (استخدام gemini-3.1-flash-image "Nano Banana 2")
    if (action === 'generate') {
      if (!cleanBase64) {
        return res.status(400).json({ error: 'لم يتم إرسال صورة (imageBase64 مفقود).' });
      }

      const contents = [
        { inlineData: { data: cleanBase64, mimeType: resolvedMimeType } },
        { text: prompt || 'قم بإنشاء صورة تسويقية احترافية لهذا المنتج.' },
      ];

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-image',
          contents,
          config: { responseModalities: ['IMAGE'] },
        });
        return res.status(200).json({ result: response });
      } catch (genError: any) {
        console.error('Image generation failed with gemini-3.1-flash-image, retrying with 2.5:', genError);
        try {
          // نموذج احتياطي لتوليد الصور
          const fallbackGenResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents,
            config: { responseModalities: ['IMAGE'] },
          });
          return res.status(200).json({ result: fallbackGenResponse });
        } catch (fallbackError: any) {
          return res.status(502).json({
            error: fallbackError.message || 'فشل توليد الصورة من Gemini.',
          });
        }
      }
    }

    return res.status(400).json({ error: 'طلب غير صريح (Invalid Action)' });
  } catch (error: any) {
    console.error('API handler error:', error);
    return res.status(500).json({ error: error.message || 'حدث خطأ في السيرفر' });
  }
}
