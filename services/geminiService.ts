import { GoogleGenAI } from '@google/genai';

// قراءة المفتاح المخصص لـ Vite
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

export async function generateMarketingImage(base64Image: string, prompt: string) {
  try {
    // استخدام النموذج المتاح لتوليد الصور
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // أو الموديل الذي اختبرته بنجاح
      contents: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        prompt
      ],
    });
    
    return response;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}
