import React from 'react';
import { X } from 'lucide-react';

interface LightboxModalProps {
  imageUrl: string | null;
  altText?: string;
  onClose: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  imageUrl,
  altText = '공간 사진',
  onClose,
}) => {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/80 hover:text-white p-2 transition-colors cursor-pointer"
          aria-label="닫기"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="w-full bg-white aspect-square max-h-[80vh] flex items-center justify-center overflow-hidden border border-gray-700 shadow-2xl">
          <img
            src={imageUrl}
            alt={altText}
            className="w-full h-full object-contain bg-white"
            referrerPolicy="no-referrer"
          />
        </div>

        {altText && (
          <p className="mt-3 text-sm text-gray-300 font-light tracking-wide text-center">
            {altText}
          </p>
        )}
      </div>
    </div>
  );
};
