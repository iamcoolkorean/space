import React, { useState } from 'react';
import { Space, Profile } from '../types';
import { MapPin, ImageOff, ArrowUpRight, Grid, List, Plus } from 'lucide-react';

interface SpaceListProps {
  profile: Profile;
  spaces: Space[];
  onSelectSpace: (space: Space) => void;
  isOwner: boolean;
  isViewMode: boolean;
  onEditProfileClick: () => void;
  onAddSpaceClick?: () => void;
}

export const SpaceList: React.FC<SpaceListProps> = ({
  profile,
  spaces,
  onSelectSpace,
  isOwner,
  isViewMode,
  onEditProfileClick,
  onAddSpaceClick,
}) => {
  // Main screen columns toggle: 1 column vs 2 columns
  const [layoutColumns, setLayoutColumns] = useState<1 | 2>(2);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Portfolio Title & Bio Section */}
      <section className="mb-10 pb-8 border-b border-zinc-800">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
              {profile.portfolio_title}
            </h1>
            <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
              {profile.bio}
            </p>
          </div>

          {!isViewMode && isOwner && (
            <button
              onClick={onEditProfileClick}
              className="self-start md:self-end text-xs font-medium text-zinc-400 hover:text-blue-400 transition-colors underline underline-offset-4 cursor-pointer"
            >
              포트폴리오 정보 수정
            </button>
          )}
        </div>
      </section>

      {/* Main Screen Toolbar: Count and 1-Col / 2-Col View Toggle */}
      <section className="mb-6 flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          공간 아카이브 ({spaces.length})
        </span>

        {/* 1열 / 2열 전환 토글 버튼 */}
        <div className="flex items-center gap-1 border border-zinc-800 bg-zinc-950 p-0.5">
          <button
            type="button"
            onClick={() => setLayoutColumns(1)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              layoutColumns === 1
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="1열로 보기"
          >
            <List className="w-3.5 h-3.5" />
            <span>1열로 보기</span>
          </button>
          <button
            type="button"
            onClick={() => setLayoutColumns(2)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              layoutColumns === 2
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="2열로 보기"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>2열로 보기</span>
          </button>
        </div>
      </section>

      {/* Main Spaces List / Grid */}
      <section>
        {spaces.length === 0 ? (
          <div className="py-24 sm:py-32 text-center border border-dashed border-zinc-800 bg-zinc-950/60 p-8 flex flex-col items-center justify-center">
            <p className="text-base text-zinc-300 font-semibold mb-2">
              아직 등록된 공간이 없습니다.
            </p>
            <p className="text-xs text-zinc-500 mb-6 max-w-sm leading-relaxed">
              첫 번째 공간을 등록하여 나만의 정갈한 공간 아카이브를 시작해보세요.
            </p>
            {!isViewMode && isOwner && onAddSpaceClick && (
              <button
                type="button"
                onClick={onAddSpaceClick}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>새로운 공간 추가하기</span>
              </button>
            )}
          </div>
        ) : layoutColumns === 2 ? (
          /* Strictly 2-Column Grid (Unconditional 2-col on all screens) */
          <div className="grid grid-cols-2 gap-3 sm:gap-6">
            {spaces.map((space) => (
              <article
                key={space.id}
                onClick={() => onSelectSpace(space)}
                className="group border border-zinc-800 bg-zinc-950 hover:border-zinc-500 transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Top: 1:1 Square Photo with Pristine White Margin */}
                  <div className="w-full aspect-square bg-white border-b border-zinc-800 overflow-hidden relative flex items-center justify-center">
                    {space.main_image_url ? (
                      <img
                        src={space.main_image_url}
                        alt={space.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full aspect-square bg-white object-contain transition-transform duration-300 group-hover:scale-103"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 text-zinc-400">
                        <ImageOff className="w-8 h-8 mb-1" />
                        <span className="text-xs">사진 없음</span>
                      </div>
                    )}
                  </div>

                  {/* Minimal Content: ONLY Space Name and Location */}
                  <div className="p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-1.5 mb-1.5">
                      <h2 className="text-sm sm:text-base font-bold text-white group-hover:text-blue-400 transition-colors tracking-tight line-clamp-1">
                        {space.name}
                      </h2>
                      <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-blue-400 transition-colors shrink-0 mt-0.5" />
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-normal">
                      <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                      <span className="truncate">{space.location}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          /* 1-Column Horizontal List */
          <div className="flex flex-col gap-4 sm:gap-6">
            {spaces.map((space) => (
              <article
                key={space.id}
                onClick={() => onSelectSpace(space)}
                className="group border border-zinc-800 bg-zinc-950 hover:border-zinc-500 transition-all p-3 sm:p-5 cursor-pointer"
              >
                <div className="flex items-center gap-4 sm:gap-6">
                  {/* Left: 1:1 Square Photo with Pristine White Margin */}
                  <div className="w-28 sm:w-44 md:w-52 aspect-square shrink-0 bg-white border border-zinc-700 overflow-hidden relative flex items-center justify-center">
                    {space.main_image_url ? (
                      <img
                        src={space.main_image_url}
                        alt={space.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full aspect-square bg-white object-contain transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 text-zinc-400">
                        <ImageOff className="w-6 h-6 mb-1" />
                        <span className="text-[10px]">사진 없음</span>
                      </div>
                    )}
                  </div>

                  {/* Right: ONLY Space Name and Location */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h2 className="text-base sm:text-xl font-bold text-white group-hover:text-blue-400 transition-colors tracking-tight truncate">
                        {space.name}
                      </h2>
                      <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition-colors shrink-0" />
                    </div>

                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-zinc-400 font-normal">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="truncate">{space.location}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
