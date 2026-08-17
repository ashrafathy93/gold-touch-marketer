import React, { useState, useEffect, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { GeneratedImageViewer } from './components/GeneratedImageViewer';
import { ImageModal } from './components/ImageModal';
import { SparkleIcon } from './components/icons/SparkleIcon';
import { generateShoppingImage } from './services/geminiService';
import { fileToBase64, fileToPreview } from './utils/fileUtils';

const loadingPhrases = [
  'جاري تحليل الصورة...',
  'جاري صقل التفاصيل الذهبية...',
  'جاري إعداد خلفية تسويقية إبداعية...',
  'جاري ضبط الإضاءة الاحترافية...',
  'اللمسات الأخيرة...',
];

interface HistoryItem {
  original: string;
  result: string;
}

const App: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>(loadingPhrases[0]);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedImageForModal, setSelectedImageForModal] = useState<string | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isLoading) {
      let i = 0;
      interval = setInterval(() => {
        i = (i + 1) % loadingPhrases.length;
        setLoadingMessage(loadingPhrases[i]);
      }, 2200);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleImageUpload = useCallback(async (file: File) => {
    setUploadedFile(file);
    setResultImage(null);
    setError(null);
    try {
      const preview = await fileToPreview(file);
      setImagePreview(preview);
    } catch (err) {
      setError('تعذر عرض معاينة للصورة. جرّب صورة أخرى.');
      console.error(err);
    }
  }, []);

  const handleClearImage = useCallback(() => {
    setUploadedFile(null);
    setImagePreview(null);
    setResultImage(null);
    setError(null);
  }, []);

  const handleImageClick = (imageUrl: string) => {
    setSelectedImageForModal(imageUrl);
    setIsModalOpen(true);
  };

  const handleGenerate = async () => {
    if (!uploadedFile) {
      setError('الرجاء رفع صورة أولاً: سكتش لتصميم ذهبي أو صورة لمنتج ذهبي.');
      return;
    }
    setIsLoading(true);
    setResultImage(null);
    setError(null);
    setLoadingMessage(loadingPhrases[0]);

    try {
      const apiImage = await fileToBase64(uploadedFile);
      const { resultImage: generated } = await generateShoppingImage(apiImage, setLoadingMessage);
      setResultImage(generated);
      if (imagePreview) {
        setHistory((prev) => [{ original: imagePreview, result: generated }, ...prev]);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadFromHistory = (item: HistoryItem) => {
    setResultImage(item.result);
    setImagePreview(item.original);
    setError(null);
  };

  return (
    <div dir="rtl" className="min-h-screen w-full flex flex-col items-center px-4 py-8">
      <header className="w-full max-w-4xl text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <SparkleIcon className="w-8 h-8 text-amber-400" />
          <h1 className="text-4xl sm:text-5xl font-bold text-amber-200">لمسة ذهب</h1>
        </div>
        <p className="text-slate-400 text-lg">
          صوّر منتجك الذهبي أو ارفع سكتش تصميمك، ودع الذكاء الاصطناعي يحوّله إلى صورة تسويقية احترافية جاهزة للنشر
        </p>
        <p className="text-slate-500 text-sm mt-2">مجاني بالكامل · متخصص حصرياً في المنتجات الذهبية</p>
      </header>

      <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col">
          <h2 className="text-2xl font-bold text-amber-200 mb-4">١. ارفع صورتك</h2>
          <ImageUploader
            onImageUpload={handleImageUpload}
            imagePreview={imagePreview}
            onClearImage={handleClearImage}
          />
          <p className="text-xs text-slate-500 mt-3 text-center">
            سكتش مرسوم بخط اليد لتصميم ذهبي، أو صورة فعلية لمنتج ذهبي — التطبيق يكتشف النوع تلقائياً ويتولى الباقي
          </p>
          <button
            onClick={handleGenerate}
            disabled={isLoading || !uploadedFile}
            className="mt-6 w-full flex items-center justify-center gap-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-900 font-bold py-3 px-6 rounded-lg transition-all duration-300 text-lg shadow-lg shadow-amber-500/10"
          >
            {isLoading ? 'جاري الإبداع...' : 'أنشئ الصورة التسويقية'}
            <SparkleIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-amber-200 mb-4">٢. النتيجة</h2>
            <GeneratedImageViewer
              isLoading={isLoading}
              resultImage={resultImage}
              error={error}
              loadingMessage={loadingMessage}
              onImageClick={handleImageClick}
            />
          </div>
          {history.length > 0 && (
            <div className="flex-grow flex flex-col min-h-0">
              <h3 className="text-xl font-bold text-amber-200 mb-3">سجل الصور</h3>
              <div className="flex-grow overflow-y-auto grid grid-cols-4 gap-2 pr-1">
                {history.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleLoadFromHistory(item)}
                    className="relative block aspect-square w-full group overflow-hidden rounded-md border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    aria-label={`تحميل النتيجة رقم ${history.length - index}`}
                  >
                    <img
                      src={item.result}
                      alt={`نتيجة سابقة رقم ${history.length - index}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {isModalOpen && selectedImageForModal && (
        <ImageModal imageUrl={selectedImageForModal} onClose={() => setIsModalOpen(false)} />
      )}

      <footer className="w-full max-w-4xl text-center mt-10 text-slate-500 text-sm">
        <p>مدعوم بواسطة Gemini · النتائج من إنتاج الذكاء الاصطناعي وقد تختلف قليلاً عن المنتج الحقيقي</p>
      </footer>
    </div>
  );
};

export default App;
