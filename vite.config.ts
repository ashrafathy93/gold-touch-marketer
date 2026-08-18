import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ملحوظة: تم حذف كتلة "define" التي كانت تُدرج مفتاح API داخل كود
// المتصفح النهائي. الآن الاتصال بـ Gemini يتم فقط من api/generate.ts
// على السيرفر (Vercel Serverless Function)، والمفتاح لا يظهر أبداً للعميل.

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
