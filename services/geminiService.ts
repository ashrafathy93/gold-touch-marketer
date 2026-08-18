// هذا الملف لا يحتوي على أي مفتاح API — الاتصال بـ Gemini يتم فقط من داخل
// api/generate.ts على السيرفر. هذا يمنع تسريب المفتاح للمتصفح.

interface Base64Image {
  data: string;
  mimeType: string;
}

// ملحوظة: fileToBase64 في utils/fileUtils.ts بترجع object وليس نص خام،
// لذلك النوع هنا لازم يطابقها تماماً حتى لا يصل object غير متوقع للسيرفر.
export async function generateShoppingImage(image: Base64Image, prompt: string) {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate',
        imageBase64: image.data,
        mimeType: image.mimeType,
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
