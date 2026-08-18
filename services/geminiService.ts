import { GoogleGenAI } from '@google/genai';

// قراءة المفتاح المخصص لـ Vite
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

export async function generateShoppingImage(base64Image: string, prompt: string) {
  try {
    // تنظيف بادئة الـ Base64 إذا كانت موجودة لضمان صحة البيانات
    const cleanBase64 = (base64Image || '').replace(/^data:image\/\w+;base64,/, '');

    // استخدام النموذج المتاح لتوليد/تحليل الصور
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { inlineData: { data: cleanBase64, mimeType: 'image/jpeg' } },
        prompt
      ],
    });
    
    return response;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}
