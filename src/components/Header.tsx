import React, { useState } from 'react';
import { Share2, Plus, Lock, Unlock, Check, Grid, Square } from 'lucide-react';

interface HeaderProps {
  columns: 1 | 2;
  onChangeColumns: (cols: 1 | 2) => void;
  isAdmin: boolean;
  isViewMode: boolean;
  onLockToggleClick: () => void;
  onAddSpaceClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  columns,
  onChangeColumns,
  isAdmin,
  isViewMode,
  onLockToggleClick,
  onAddSpaceClick,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyShareLink = () => {
    const origin = window.location.origin;
    const shareUrl = `${origin}?mode=view`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#27272A]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="text-base sm:text-lg font-bold tracking-tight text-white uppercase whitespace-nowrap hover:text-[#A1A1AA] transition-colors"
          >
            SPACE ARCHIVE
          </a>
          {isViewMode && (
            <span className="text-[10px] font-semibold text-[#A1A1AA] uppercase tracking-widest pl-2 border-l border-[#27272A]">
              VIEW ONLY
            </span>
          )}
        </div>

        {/* Zone 2: View Toggle, Share, Lock Toggle, Add Space */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs font-medium text-[#A1A1AA]">
          {/* 1-Col / 2-Col View Toggle */}
          <div className="flex items-center border border-[#27272A] bg-[#0A0A0A] p-0.5">
            <button
              type="button"
              onClick={() => onChangeColumns(2)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                columns === 2
                  ? 'bg-[#2563EB] text-white'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
              title="2열 그리드로 보기"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">2열</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeColumns(1)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                columns === 1
                  ? 'bg-[#2563EB] text-white'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
              title="1열로 보기"
            >
              <Square className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">1열</span>
            </button>
          </div>

          {/* Share Link Copy */}
          <button
            type="button"
            onClick={handleCopyShareLink}
            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[#27272A] text-[#A1A1AA] hover:text-white hover:border-zinc-600 transition-colors cursor-pointer"
            title="감상 전용 공유 링크 복사 (?mode=view)"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#2563EB]" />
                <span className="hidden md:inline text-white">복사됨</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">공유</span>
              </>
            )}
          </button>

          {/* Admin Lock Toggle Icon Button */}
          {!isViewMode && (
            <button
              type="button"
              onClick={onLockToggleClick}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs transition-colors cursor-pointer border ${
                isAdmin
                  ? 'border-[#2563EB] bg-[#2563EB]/15 text-white hover:bg-[#2563EB]/25'
                  : 'border-[#27272A] bg-[#0A0A0A] text-[#A1A1AA] hover:text-white hover:border-zinc-600'
              }`}
              title={isAdmin ? '클릭하여 관리자 로그아웃' : '관리자 비밀번호 인증'}
            >
              {isAdmin ? (
                <Unlock className="w-3.5 h-3.5 text-[#2563EB]" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-[#A1A1AA]" />
              )}
              <span className="hidden sm:inline">
                {isAdmin ? '관리자' : '인증'}
              </span>
            </button>
          )}

          {/* Write Button: Only visible when Admin is authenticated and not in view mode */}
          {!isViewMode && isAdmin && (
            <button
              type="button"
              onClick={onAddSpaceClick}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-500 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>공간 추가</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
