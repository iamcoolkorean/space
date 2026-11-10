import React from 'react';
import { Space } from '../types';
import { MapPin, ImageOff, ArrowUpRight, Plus, Grid, Square } from 'lucide-react';

interface SpaceListProps {
  spaces: Space[];
  columns: 1 | 2;
  onChangeColumns: (cols: 1 | 2) => void;
  onSelectSpace: (space: Space) => void;
  isAdmin: boolean;
  isViewMode: boolean;
  onAddSpaceClick?: () => void;
}

export const SpaceList: React.FC<SpaceListProps> = ({
  spaces,
  columns,
  onChangeColumns,
  onSelectSpace,
  isAdmin,
  isViewMode,
  onAddSpaceClick,
}) => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 w-full">
      {/* Main Feed Toolbar */}
      <div className="mb-6 flex items-center justify-between border-b border-[#27272A] pb-3">
        <span className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-widest">
          ARCHIVED SPACES ({spaces.length})
        </span>

        <div className="flex items-center gap-1 border border-[#27272A] bg-[#0A0A0A] p-0.5">
          <button
            type="button"
            onClick={() => onChangeColumns(2)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
              columns === 2
                ? 'bg-[#2563EB] text-white'
                : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>2열 보기</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeColumns(1)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
              columns === 1
                ? 'bg-[#2563EB] text-white'
                : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>1열 보기</span>
          </button>
        </div>
      </div>

      {/* Spaces Grid */}
      {spaces.length === 0 ? (
        <div className="py-24 sm:py-32 text-center border border-[#27272A] bg-[#0A0A0A] p-8 flex flex-col items-center justify-center">
          <p className="text-base text-white font-semibold mb-2">
            아직 등록된 공간이 없습니다.
          </p>
          <p className="text-xs text-[#A1A1AA] mb-6 max-w-sm leading-relaxed">
            첫 번째 공간을 등록하여 나만의 정갈한 공간 아카이브를 시작해보세요.
          </p>
          {!isViewMode && isAdmin && onAddSpaceClick && (
            <button
              type="button"
              onClick={onAddSpaceClick}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-500 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>공간 추가하기</span>
            </button>
          )}
        </div>
      ) : (
        <div
          className={`grid ${
            columns === 2
              ? 'grid-cols-2 gap-3 sm:gap-6'
              : 'grid-cols-1 gap-6 max-w-2xl mx-auto'
          }`}
        >
          {spaces.map((space) => (
            <article
              key={space.id}
              onClick={() => onSelectSpace(space)}
              className="group border border-[#27272A] bg-[#0A0A0A] hover:border-[#2563EB] transition-colors cursor-pointer flex flex-col justify-between overflow-hidden"
            >
              <div>
                {/* 1:1 Square Photo with Pure White (#FFFFFF) Matting */}
                <div className="w-full aspect-square bg-white border-b border-[#27272A] overflow-hidden relative flex items-center justify-center">
                  {space.main_image_url ? (
                    <img
                      src={space.main_image_url}
                      alt={space.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full aspect-square bg-white object-contain transition-transform duration-300 group-hover:scale-102"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-white text-zinc-400">
                      <ImageOff className="w-8 h-8 mb-1" />
                      <span className="text-xs">사진 없음</span>
                    </div>
                  )}
                </div>

                {/* Minimal Card Info: Only Space Name & Detailed Address */}
                <div className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-1.5 mb-1.5">
                    <h2 className="text-sm sm:text-base font-bold text-white group-hover:text-[#2563EB] transition-colors tracking-tight line-clamp-1">
                      {space.name}
                    </h2>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-[#2563EB] transition-colors shrink-0 mt-0.5" />
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-[#A1A1AA] font-normal">
                    <MapPin className="w-3 h-3 text-[#2563EB] shrink-0" />
                    <span className="truncate">{space.location}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
