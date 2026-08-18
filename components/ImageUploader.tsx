import React, { useCallback, useState } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  imagePreview: string | null;
  onClearImage: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, imagePreview, onClearImage }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageUpload(e.dataTransfer.files[0]);
    }
  }, [onImageUpload]);

  return (
    <div className="flex-grow">
      <label
        htmlFor="file-upload"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative w-full h-full min-h-[200px] flex items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${
          isDragging ? 'border-amber-400 bg-slate-700/50' : 'border-slate-600 hover:border-slate-500'
        } ${imagePreview ? 'border-solid' : ''}`}
      >
        <input
          id="file-upload"
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp"
        />
        {imagePreview ? (
          <>
            <img src={imagePreview} alt="معاينة الصورة المرفوعة" className="w-full h-full max-h-52 object-contain rounded-md" />
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClearImage();
              }}
              className="absolute top-2 right-2 bg-slate-900/70 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-500/80 transition-all duration-200"
              aria-label="إزالة الصورة"
            >
              &#x2715;
            </button>
          </>
        ) : (
           <div className="flex flex-col items-center justify-center text-center text-slate-400">
            <UploadIcon className="w-12 h-12 mb-4" />
            <p className="font-semibold">اسحب وأفلت صورتك هنا</p>
            <p className="text-sm">أو اضغط لاختيار ملف من جهازك</p>
            <p className="text-xs mt-2">سكتش مرسوم أو صورة منتج ذهبي (PNG, JPG, WEBP)</p>
          </div>
        )}
      </label>
    </div>
  );
};