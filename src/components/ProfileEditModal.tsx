import React, { useState } from 'react';
import { Profile } from '../types';
import { X, User } from 'lucide-react';

interface ProfileEditModalProps {
  isOpen: boolean;
  profile: Profile;
  onSave: (updates: Partial<Profile>) => Promise<void>;
  onClose: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  profile,
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState(profile.portfolio_title);
  const [bio, setBio] = useState(profile.bio);
  const [slug, setSlug] = useState(profile.slug);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('포트폴리오 제목을 입력해주세요.');
      return;
    }
    if (!slug.trim()) {
      setErrorMsg('고유 포트폴리오 슬러그(ID)를 입력해주세요.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      await onSave({
        portfolio_title: title.trim(),
        bio: bio.trim(),
        slug: slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || '프로필 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 p-6 shadow-2xl text-zinc-100">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-white" />
            <h3 className="text-sm font-semibold tracking-wide text-white uppercase">
              포트폴리오 프로필 설정
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              포트폴리오 제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: SPACE ARCHIVE : 나만의 공간 기록"
              required
              className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs text-white focus:outline-hidden focus:border-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              소개글 (Bio)
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="포트폴리오의 취지와 아카이빙 방향성을 소개해주세요."
              className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs text-white focus:outline-hidden focus:border-white leading-relaxed transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              고유 슬러그 (공유 링크 ID)
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="minimal-archive"
              required
              className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs font-mono text-white focus:outline-hidden focus:border-white transition-colors"
            />
            <p className="mt-1 text-[11px] text-zinc-500">
              * 공유 링크 생성 시 <code>?u={slug}&amp;mode=view</code> 형식으로 사용됩니다.
            </p>
          </div>

          {errorMsg && (
            <p className="text-xs text-red-400">{errorMsg}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-black bg-white hover:bg-zinc-200 transition-colors cursor-pointer shadow-xs"
            >
              {isSaving ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
