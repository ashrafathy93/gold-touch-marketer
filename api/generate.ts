import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { action, imageBase64, mimeType, prompt } = req.body;

  try {
    // 1. فهم وتحليل صورة مجوهرات قائمة
    if (action === 'analyze') {
      const analysisResponse = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          {
            inlineData: { data: imageBase64, mimeType: mimeType || 'image/png' },
          },
          prompt || "قم بتحليل هذا التصميم واستخراج وصف دقيق للمجوهرات، الأحجار الكريمة، والمعدن المستعمل."
        ],
      });

      return res.status(200).json({ result: analysisResponse.text });
    }

    // 2. توليد صورة تسويقية جديدة (مع خاصية الـ Fallback)
    if (action === 'generate') {
      try {
        // المحاولة الأولى: النموذج الأساسي
        const primaryResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: prompt,
        });

        return res.status(200).json({ result: primaryResponse });
      } catch (liteError) {
        console.warn('فشل النموذج الأساسي، جاري التحويل للنموذج الاحتياطي:', liteError.message);

        // المحاولة الثانية: النموذج الاحتياطي عند استهلاك الكوتا أو حدوث أخطاء
        const fallbackResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-image',
          contents: prompt,
        });

        return res.status(200).json({ result: fallbackResponse });
      }
    }

    return res.status(400).json({ error: 'Action غير معروف' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'حدث خطأ في السيرفر' });
  }
}
