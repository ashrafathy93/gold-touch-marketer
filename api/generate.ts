import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // السماح بطلبات POST فقط
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { action, imageBase64, mimeType, prompt } = req.body || {};

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY غير معرف في Vercel' });
    }

    // 1. تحليل فهم الصورة
    if (action === 'analyze') {
      const cleanBase64 = (imageBase64 || '').replace(/^data:image\/\w+;base64,/, '');
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          { inlineData: { data: cleanBase64, mimeType: mimeType || 'image/png' } },
          prompt || 'قم بتحليل تصميم هذه المجوهرات واستخراج وصف دقيق.'
        ],
      });
      return res.status(200).json({ result: response.text });
    }

    // 2. توليد صورة مع نظام التحويل التلقائي (Fallback)
    if (action === 'generate') {
      try {
        const primaryResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: prompt,
        });
        return res.status(200).json({ result: primaryResponse });
      } catch (primaryError) {
        // التحويل للنموذج الاحتياطي في حال حدوث خطأ
        const fallbackResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-image',
          contents: prompt,
        });
        return res.status(200).json({ result: fallbackResponse });
      }
    }

    return res.status(400).json({ error: 'طلب غير صريح (Invalid Action)' });

  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'حدث خطأ في السيرفر' });
  }
}
