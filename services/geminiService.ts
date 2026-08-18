import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey });

export async function generateShoppingImage(
  base64Image: string,
  prompt: string
) {
  try {
    const cleanBase64 = (base64Image || '')
      .replace(/^data:image\/\w+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image',

      contents: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: 'image/jpeg'
          }
        },
        {
          text: prompt
        }
      ],

      config: {
        responseModalities: ['IMAGE']
      }
    });

    console.log('Gemini Response:', response);

    return response;

  } catch (error) {
    console.error('Gemini Error:', error);
    throw error;
  }
}
