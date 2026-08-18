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

    // imageBase64 المفروض يكون نص (string). لو وصل بشكل غير متوقع (object,
    // undefined، إلخ) بسبب اختلاف في fileToBase64 بالفرونت إند، نتعامل معه
    // بأمان بدل ما نكسر السيرفر بخطأ "replace is not a function".
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

    // 1. تحليل/فهم الصورة (نص فقط)
    if (action === 'analyze') {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { inlineData: { data: cleanBase64, mimeType: resolvedMimeType } },
          { text: prompt || 'قم بتحليل تصميم هذه المجوهرات واستخراج وصف دقيق.' },
        ],
      });
      return res.status(200).json({ result: response.text });
    }

    // 2. توليد صورة تسويقية من الصورة المرفوعة، مع نموذج احتياطي عند الفشل
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
          model: 'gemini-2.5-flash-image',
          contents,
          config: { responseModalities: ['IMAGE'] },
        });
        return res.status(200).json({ result: response });
      } catch (genError: any) {
        console.error('Image generation failed:', genError);
        return res.status(502).json({
          error: genError.message || 'فشل توليد الصورة من Gemini.',
        });
      }
    }

    return res.status(400).json({ error: 'طلب غير صريح (Invalid Action)' });
  } catch (error: any) {
    console.error('API handler error:', error);
    return res.status(500).json({ error: error.message || 'حدث خطأ في السيرفر' });
  }
}
