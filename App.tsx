import React, { useState, useEffect, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { GeneratedImageViewer } from './components/GeneratedImageViewer';
import { ImageModal } from './components/ImageModal';
import { SparkleIcon } from './components/icons/SparkleIcon';
import { generateShoppingImage } from './services/geminiService';
import { fileToBase64, fileToPreview } from './utils/fileUtils';

interface HistoryItem {
  original: string;
  result: string;
}

const App: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('جاري التحليل...');
  
  // استدعاء السجل من localStorage عند التحميل
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('creativity_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedImageForModal, setSelectedImageForModal] = useState<string | null>(null);

  // حفظ السجل تلقائياً عند أي تغيير
  useEffect(() => {
    localStorage.setItem('creativity_history', JSON.stringify(history));
  }, [history]);

  const handleImageUpload = useCallback(async (file: File) => {
    setUploadedFile(file);
    try {
      setImagePreview(await fileToPreview(file));
    } catch (err) {
      setError('تعذر عرض معاينة للصورة.');
    }
  }, []);

  const handleGenerate = async () => {
    if (!uploadedFile) return;
    setIsLoading(true);
    setError(null);
    try {
      const apiImage = await fileToBase64(uploadedFile);
      const { resultImage: generated } = await generateShoppingImage(apiImage, setLoadingMessage);
      setResultImage(generated);
      if (imagePreview) {
        setHistory((prev) => [{ original: imagePreview, result: generated }, ...prev]);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showWelcome) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-100 to-pink-50 relative overflow-hidden">
        <button 
          onClick={() => setShowWelcome(false)}
          className="hover:scale-105 transition-transform duration-300 focus:outline-none"
        >
          <img src="https://i.gifer.com/33Ho.gif" alt="Enter App" className="w-48 h-48 rounded-full shadow-2xl border-4 border-white/50" />
        </button>
        <h1 className="text-6xl md:text-8xl font-bold text-slate-800 mt-6 tracking-tight font-sans">creativity-🏹</h1>
        <p className="text-slate-600 text-lg md:text-xl mt-4 font-medium text-center max-w-md px-4">
          A project by Ashrafathy. Generate marketing-ready visuals for your jewelry designs.
        </p>
        <a 
          href="https://www.facebook.com/Ashrafathy" 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-8 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
          </svg>
        </a>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen w-full flex flex-col items-center px-4 py-8 bg-gradient-to-br from-indigo-50 via-purple-100 to-pink-50">
      <header className="w-full max-w-4xl text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-800">creativity-🏹</h1>
      </header>
      <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* جزء الرفع والتوليد */}
        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-white/40 shadow-xl flex flex-col">
          <ImageUploader onImageUpload={handleImageUpload} imagePreview={imagePreview} onClearImage={() => setUploadedFile(null)} />
          <button onClick={handleGenerate} disabled={isLoading || !uploadedFile} className="mt-6 w-full flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white font-bold py-3 px-6 rounded-lg transition-all text-lg shadow-lg">
            {isLoading ? 'جاري الإبداع...' : 'أنشئ الصورة التسويقية'}
            <SparkleIcon className="w-5 h-5" />
          </button>
        </div>
        {/* جزء النتيجة والسجل */}
        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-white/40 shadow-xl flex flex-col space-y-4">
          <GeneratedImageViewer isLoading={isLoading} resultImage={resultImage} error={error} loadingMessage={loadingMessage} onImageClick={(url) => { setSelectedImageForModal(url); setIsModalOpen(true); }} />
          {history.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-slate-700 mb-3">أعمالك السابقة</h3>
              <div className="overflow-y-auto h-48 grid grid-cols-4 gap-2">
                {history.map((item, index) => (
                  <img key={index} src={item.result} onClick={() => setResultImage(item.result)} className="w-full h-full object-cover rounded-md cursor-pointer hover:scale-105 transition-transform" />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      {isModalOpen && selectedImageForModal && <ImageModal imageUrl={selectedImageForModal} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};
export default App;
