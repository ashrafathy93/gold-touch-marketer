/**
 * Converts a File object to a base64 encoded string, separating the data and MIME type.
 * This is suitable for use with the Gemini API.
 * @param file The File object to convert.
 * @returns A Promise that resolves to an object with the base64 data and MIME type.
 */
export const fileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const [mimeString, base64Data] = result.split(',');
      if (!base64Data) {
        reject(new Error("Invalid file format: could not extract base64 data."));
        return;
      }
      // e.g., "data:image/png;base64" -> "image/png"
      const mimeTypeMatch = mimeString.match(/:(.*?);/);
      if (!mimeTypeMatch || !mimeTypeMatch[1]) {
        reject(new Error("Invalid file format: could not extract MIME type."));
        return;
      }
      const mimeType = mimeTypeMatch[1];
      resolve({ data: base64Data, mimeType });
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Converts a File object to a full base64 data URL for use in `<img>` src attributes.
 * @param file The File object to convert.
 * @returns A Promise that resolves to the full data URL string.
 */
export const fileToPreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
