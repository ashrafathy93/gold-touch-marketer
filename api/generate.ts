import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

export async function generateImage(base64Image: string, prompt: string) {
  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      { inlineData: { data: cleanBase64, mimeType: 'image/jpeg' } },
      prompt,
    ],
  });

  return response;
}
