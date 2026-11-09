import React, { useState } from 'react';
import { Share2, Plus, LogIn, LogOut, Check, UserCheck } from 'lucide-react';
import { AuthSessionUser } from '../types';

interface HeaderProps {
  portfolioTitle: string;
  slug: string;
  currentUser: AuthSessionUser | null;
  isOwner: boolean;
  isViewMode: boolean;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onAddSpaceClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  portfolioTitle: _portfolioTitle,
  slug,
  currentUser,
  isOwner,
  isViewMode,
  onLoginClick,
  onLogoutClick,
  onAddSpaceClick,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyShareLink = () => {
    const origin = window.location.origin;
    const shareUrl = `${origin}?u=${encodeURIComponent(slug)}&mode=view`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="text-base sm:text-lg font-bold tracking-tight text-white uppercase whitespace-nowrap hover:text-blue-400 transition-colors"
          >
            SPACE ARCHIVE
          </a>
          {isViewMode && (
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-widest pl-2 border-l border-zinc-700">
              전시 모드
            </span>
          )}
        </div>

        {/* Zone 2: Navigation & Auxiliary Actions */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs font-medium text-zinc-300">
          {/* Share Link Copy */}
          <button
            type="button"
            onClick={handleCopyShareLink}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="외부 공유 링크 복사 (?u=slug&mode=view)"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline text-blue-400">링크 복사됨</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">공유 링크</span>
              </>
            )}
          </button>

          {/* Auth State: Login / Logout */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-zinc-400 px-2 py-0.5 bg-zinc-900 border border-zinc-800">
                <UserCheck className="w-3 h-3 text-blue-400" />
                <span className="max-w-[120px] truncate">{currentUser.email || '소유자'}</span>
              </span>
              <button
                type="button"
                onClick={onLogoutClick}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="로그아웃"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">로그아웃</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onLoginClick}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="로그인"
            >
              <LogIn className="w-3.5 h-3.5 text-blue-400" />
              <span>로그인</span>
            </button>
          )}
        </div>

        {/* Zone 3: Primary Action (Only shown to owner when not in view mode) */}
        {!isViewMode && isOwner && (
          <div className="shrink-0">
            <button
              type="button"
              onClick={onAddSpaceClick}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>새 공간 추가</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
