import React from 'react';
import { SparkleIcon } from './icons/SparkleIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ZoomInIcon } from './icons/ZoomInIcon';

interface GeneratedImageViewerProps {
  isLoading: boolean;
  resultImage: string | null;
  error: string | null;
  loadingMessage: string;
  onImageClick: (imageUrl: string) => void;
}

const LoadingSpinner: React.FC = () => (
  <svg className="animate-spin h-12 w-12 text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const handleDownloadImage = (imageUrl: string) => {
  let count = parseInt(localStorage.getItem('goldImageDownloadCount') || '0', 10);
  count++;
  localStorage.setItem('goldImageDownloadCount', count.toString());

  const filename = `صورة-تسويقية-ذهبية-${count}.jpeg`;
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const GeneratedImageViewer: React.FC<GeneratedImageViewerProps> = ({
  isLoading,
  resultImage,
  error,
  loadingMessage,
  onImageClick,
}) => {
  let content;

  if (isLoading) {
    content = (
      <div className="flex flex-col items-center justify-center text-center">
        <LoadingSpinner />
        <p className="mt-4 text-lg font-medium text-amber-200">{loadingMessage}</p>
        <p className="text-sm text-slate-400">لحظات ويظهر لك التصميم النهائي...</p>
      </div>
    );
  } else if (error) {
    content = (
      <div className="flex flex-col items-center justify-center text-center p-4 bg-red-900/20 border border-red-500 rounded-lg max-w-md">
        <p className="font-semibold text-red-300">حدث خطأ</p>
        <p className="text-sm text-red-400 mt-2">{error}</p>
      </div>
    );
  } else if (resultImage) {
    content = (
      <div className="w-full h-full flex justify-center items-center">
        <div className="flex flex-col gap-3 group max-w-md w-full">
          <h3 className="text-center font-semibold text-amber-100/90 text-sm">النتيجة النهائية</h3>
          <div className="relative aspect-square rounded-lg overflow-hidden shadow-2xl shadow-black/50 border border-amber-500/20">
            <button onClick={() => onImageClick(resultImage)} className="w-full h-full block cursor-zoom-in">
              <img
                src={resultImage}
                alt="صورة تسويقية للمنتج الذهبي تم إنشاؤها بالذكاء الاصطناعي"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </button>
            <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadImage(resultImage);
                }}
                className="bg-slate-900/60 backdrop-blur-sm text-white rounded-full p-2 flex items-center justify-center hover:bg-amber-500/80 transition-all"
                aria-label="تحميل الصورة"
              >
                <DownloadIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <ZoomInIcon className="w-10 h-10 text-white/80" />
            </div>
          </div>
          <button
            onClick={() => handleDownloadImage(resultImage)}
            className="w-full flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-medium py-2.5 px-4 rounded-lg transition-colors border border-amber-500/30"
          >
            <DownloadIcon className="w-4 h-4" />
            تحميل الصورة
          </button>
        </div>
      </div>
    );
  } else {
    content = (
      <div className="flex flex-col items-center justify-center text-center text-slate-500">
        <SparkleIcon className="w-16 h-16 mb-4 opacity-50" />
        <p className="font-medium">ستظهر صورتك التسويقية هنا</p>
        <p className="text-sm">ارفع سكتش أو صورة منتج ذهبي ودع الذكاء الاصطناعي يبدع.</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[300px] flex items-center justify-center bg-slate-900/70 rounded-lg p-4">
      {content}
    </div>
  );
};
