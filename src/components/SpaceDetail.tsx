import React, { useState } from 'react';
import { Space } from '../types';
import { ArrowLeft, Edit3, Trash2, MapPin, Grid, Square, Maximize2 } from 'lucide-react';

interface SpaceDetailProps {
  space: Space;
  isAdmin: boolean;
  isViewMode: boolean;
  onBack: () => void;
  onEdit: (space: Space) => void;
  onDelete: (spaceId: string) => void;
  onOpenLightbox: (url: string, caption?: string) => void;
}

export const SpaceDetail: React.FC<SpaceDetailProps> = ({
  space,
  isAdmin,
  isViewMode,
  onBack,
  onEdit,
  onDelete,
  onOpenLightbox,
}) => {
  const [columns, setColumns] = useState<1 | 2>(2);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const allImages = React.useMemo(() => {
    const list: string[] = [];
    if (space.main_image_url) {
      list.push(space.main_image_url);
    }
    if (Array.isArray(space.sub_image_urls)) {
      space.sub_image_urls.forEach((url) => {
        if (url && !list.includes(url)) {
          list.push(url);
        }
      });
    }
    return list;
  }, [space]);

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete(space.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3500);
    }
  };

  const canManage = isAdmin && !isViewMode;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 text-white font-sans w-full">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between pb-6 mb-8 border-b border-[#27272A]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-[#A1A1AA] hover:text-white transition-colors uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>목록으로 돌아가기</span>
        </button>

        {/* Edit and Delete Actions (Only shown to admin when not in view mode) */}
        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(space)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-500 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>수정</span>
            </button>
            <button
              onClick={handleDeleteClick}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                confirmDelete
                  ? 'bg-red-600 text-white border border-red-600'
                  : 'text-[#A1A1AA] border border-[#27272A] hover:text-red-400 hover:border-red-500'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{confirmDelete ? '정말 삭제할까요?' : '삭제'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 1. Header Information: Name, Location, Hashtags, Comment */}
      <article className="mb-10">
        {/* Name */}
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-3">
          {space.name}
        </h1>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-[#A1A1AA] mb-4 font-normal">
          <MapPin className="w-4 h-4 text-[#2563EB] shrink-0" />
          <span>{space.location}</span>
        </div>

        {/* Tags (Zero-Pill: Unboxed plain text with #) */}
        {space.tags && space.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-medium text-[#A1A1AA] mb-6">
            {space.tags.map((tag, idx) => {
              const label = tag.startsWith('#') ? tag : `#${tag}`;
              return (
                <span key={idx} className="text-[#A1A1AA] hover:text-white transition-colors">
                  {label}
                </span>
              );
            })}
          </div>
        )}

        {/* Contemplative Comment Block */}
        {space.comment && (
          <div className="p-5 sm:p-6 bg-[#0A0A0A] border border-[#27272A] text-sm sm:text-base text-zinc-200 leading-relaxed font-light whitespace-pre-line">
            {space.comment}
          </div>
        )}
      </article>

      {/* 2. Photo Grid Controls & Gallery */}
      <section className="pt-6 border-t border-[#27272A]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-white">
            ARCHIVE GALLERY ({allImages.length})
          </h2>

          {/* 1-col / 2-col View Toggle Buttons */}
          <div className="flex items-center gap-1 border border-[#27272A] bg-[#0A0A0A] p-0.5">
            <button
              onClick={() => setColumns(2)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                columns === 2
                  ? 'bg-[#2563EB] text-white'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
              title="2열로 정방형 사진 보기"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>2열 보기</span>
            </button>
            <button
              onClick={() => setColumns(1)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                columns === 1
                  ? 'bg-[#2563EB] text-white'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
              title="1열로 정방형 사진 크게 보기"
            >
              <Square className="w-3.5 h-3.5" />
              <span>1열 보기</span>
            </button>
          </div>
        </div>

        {/* 1:1 Square Photo Grid (Pure white #FFFFFF matting preserved) */}
        <div
          className={`grid ${
            columns === 2
              ? 'grid-cols-2 gap-3 sm:gap-6'
              : 'grid-cols-1 gap-6 max-w-2xl mx-auto'
          }`}
        >
          {allImages.map((imgUrl, index) => (
            <div
              key={index}
              onClick={() => onOpenLightbox(imgUrl, `${space.name} - 사진 ${index + 1}`)}
              className="group relative aspect-square bg-white border border-[#27272A] hover:border-[#2563EB] overflow-hidden cursor-pointer transition-colors"
            >
              <img
                src={imgUrl}
                alt={`${space.name} - ${index + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full aspect-square bg-white object-contain transition-transform duration-300 group-hover:scale-102"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                <span className="px-2.5 py-1.5 bg-[#0A0A0A]/90 text-white border border-[#27272A] text-xs font-medium flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-[#2563EB]" /> 확대 보기
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
