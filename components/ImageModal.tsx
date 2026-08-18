import React, { useState } from 'react';

interface Props {
  imageUrl: string;
  onClose: () => void;
}

export const ImageModal: React.FC<Props> = ({ imageUrl, onClose }) => {
  const [scale, setScale] = useState(1);
  const downloadName = `creativity-🏹-${Math.floor(Math.random() * 100000)}.png`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="relative max-w-5xl w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-0 text-white hover:text-red-400 font-bold text-2xl">✕</button>
        
        <div className="overflow-hidden w-full flex justify-center bg-transparent rounded-lg">
          <img 
            src={imageUrl} 
            className="max-h-[80vh] object-contain transition-transform duration-300 ease-out cursor-pointer"
            style={{ transform: `scale(${scale})` }}
            onClick={() => setScale(scale === 1 ? 1.5 : (scale === 1.5 ? 2 : 1))}
            title="اضغط للتكبير / التصغير"
          />
        </div>

        <div className="flex gap-4 mt-4">
          <button onClick={() => setScale(scale === 1 ? 1.5 : 1)} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg">
            🔍 {scale > 1 ? 'تصغير' : 'تكبير'}
          </button>
          <a href={imageUrl} download={downloadName} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-bold">
            ⬇️ تحميل الصورة
          </a>
        </div>
      </div>
    </div>
  );
};
