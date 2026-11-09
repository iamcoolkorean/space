import React, { useState } from 'react';
import { Space, AuthSessionUser } from '../types';
import { ArrowLeft, Edit3, Trash2, MapPin, Grid, Square, Maximize2 } from 'lucide-react';

interface SpaceDetailProps {
  space: Space;
  isOwner: boolean;
  currentUser?: AuthSessionUser | null;
  isViewMode: boolean;
  onBack: () => void;
  onEdit: (space: Space) => void;
  onDelete: (spaceId: string) => void;
  onOpenLightbox: (url: string, caption?: string) => void;
}

export const SpaceDetail: React.FC<SpaceDetailProps> = ({
  space,
  isOwner,
  currentUser,
  isViewMode: _isViewMode,
  onBack,
  onEdit,
  onDelete,
  onOpenLightbox,
}) => {
  // Columns toggle: default 2 columns (grid-cols-2) vs 1 column (grid-cols-1)
  const [columns, setColumns] = useState<1 | 2>(2);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // User can edit if marked as isOwner OR if logged-in user ID matches space's profile_id
  const canEdit = Boolean(
    isOwner || (currentUser && (currentUser.id === space.profile_id || isOwner))
  );

  // Combine main image + sub images (de-duplicating if identical)
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 text-gray-100">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between pb-6 mb-8 border-b border-zinc-800">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>목록으로 돌아가기</span>
        </button>

        {/* Edit and Delete Actions (Shown to owner) */}
        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(space)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-black bg-white hover:bg-zinc-200 transition-colors cursor-pointer shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>수정하기</span>
            </button>
            <button
              onClick={handleDeleteClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                confirmDelete
                  ? 'bg-red-600 text-white border border-red-600'
                  : 'text-zinc-400 border border-zinc-700 hover:text-red-400 hover:border-red-500'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{confirmDelete ? '정말 삭제할까요?' : '삭제하기'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 1. Header Information: Name, Location, Tags, Comment */}
      <article className="mb-10">
        {/* Name */}
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-3">
          {space.name}
        </h1>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-4 font-normal">
          <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
          <span>{space.location}</span>
        </div>

        {/* Tags */}
        {space.tags && space.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm font-medium text-zinc-300 mb-6">
            {space.tags.map((tag, idx) => {
              const label = tag.startsWith('#') ? tag : `#${tag}`;
              return <span key={idx}>{label}</span>;
            })}
          </div>
        )}

        {/* Comment */}
        {space.comment && (
          <div className="p-5 sm:p-6 bg-zinc-900/60 border border-zinc-800 text-sm sm:text-base text-zinc-200 leading-relaxed font-light whitespace-pre-line">
            {space.comment}
          </div>
        )}
      </article>

      {/* 2. Photo Grid Controls & Gallery */}
      <section className="pt-6 border-t border-zinc-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            공간 사진 아카이브 ({allImages.length})
          </h2>

          {/* 1-col / 2-col View Toggle Buttons */}
          <div className="flex items-center gap-1 border border-zinc-800 bg-zinc-950 p-0.5">
            <button
              onClick={() => setColumns(2)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                columns === 2
                  ? 'bg-white text-black shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
              title="2열로 정방형 사진 보기"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>2열로 보기</span>
            </button>
            <button
              onClick={() => setColumns(1)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                columns === 1
                  ? 'bg-white text-black shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
              title="1열로 정방형 사진 크게 보기"
            >
              <Square className="w-3.5 h-3.5" />
              <span>1열로 보기</span>
            </button>
          </div>
        </div>

        {/* 1:1 Square Photo Grid (White margin preserved) */}
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
              className="group relative aspect-square bg-white border border-zinc-800 overflow-hidden cursor-pointer"
            >
              <img
                src={imgUrl}
                alt={`${space.name} - ${index + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full aspect-square bg-white object-contain transition-transform duration-300 group-hover:scale-102"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                <span className="p-2 bg-black/80 text-white border border-zinc-700 text-xs font-medium shadow-md flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5" /> 확대 보기
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
