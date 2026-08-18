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

    const cleanBase64 = (imageBase64 || '').replace(/^data:image\/\w+;base64,/, '');
    const resolvedMimeType = mimeType || 'image/jpeg';

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
        const primaryResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents,
          config: { responseModalities: ['IMAGE'] },
        });
        return res.status(200).json({ result: primaryResponse });
      } catch (primaryError) {
        // التحويل للنموذج الاحتياطي في حال حدوث خطأ
        console.error('Primary model failed, falling back:', primaryError);
        const fallbackResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-image',
          contents,
          config: { responseModalities: ['IMAGE'] },
        });
        return res.status(200).json({ result: fallbackResponse });
      }
    }

    return res.status(400).json({ error: 'طلب غير صريح (Invalid Action)' });
  } catch (error: any) {
    console.error('API handler error:', error);
    return res.status(500).json({ error: error.message || 'حدث خطأ في السيرفر' });
  }
}
