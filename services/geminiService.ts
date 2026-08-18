export async function generateShoppingImage(imageBase64: string, onProgress: (msg: string) => void) {
  onProgress('جاري الاتصال بالسيرفر الآمن...');
  
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageBase64 }),
  });

  if (!response.ok) {
    throw new Error('فشل الاتصال بالسيرفر أو تم استهلاك الحصة.');
  }

  const data = await response.json();
  return { resultImage: data.resultImage };
}
