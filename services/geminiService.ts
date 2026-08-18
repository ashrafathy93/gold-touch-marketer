// هذا الملف لا يحتوي على أي مفتاح API — الاتصال بـ Gemini يتم فقط من داخل
// api/generate.ts على السيرفر. هذا يمنع تسريب المفتاح للمتصفح.

export async function generateShoppingImage(base64Image: string, prompt: string) {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate',
        imageBase64: base64Image,
        mimeType: 'image/jpeg',
        prompt,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'فشل الاتصال بالسيرفر أو تم استهلاك الحصة.');
    }

    console.log('Gemini Response:', data.result);

    // نُعيد نفس شكل الاستجابة الذي يتوقعه App.tsx
    // (response.candidates?.[0]?.content?.parts)
    return data.result;
  } catch (error) {
    console.error('Gemini Error:', error);
    throw error;
  }
}
