import React, { useState } from 'react';
import { Sparkles, User, ArrowRight } from 'lucide-react';

interface InitialProfileModalProps {
  isOpen: boolean;
  userId: string;
  userEmail?: string;
  onProfileCreated: (title: string, slug: string, bio: string) => Promise<void>;
}

export const InitialProfileModal: React.FC<InitialProfileModalProps> = ({
  isOpen,
  userId: _userId,
  userEmail,
  onProfileCreated,
}) => {
  const defaultSlug = (userEmail ? userEmail.split('@')[0] : 'my-space')
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-');

  const [title, setTitle] = useState('나만의 공간 기록');
  const [slug, setSlug] = useState(defaultSlug);
  const [bio, setBio] = useState('당신의 아카이브에 대해 설명해주세요');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('포트폴리오 제목을 입력해주세요.');
      return;
    }
    if (!slug.trim()) {
      setErrorMsg('고유 주소 아이디(slug)를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await onProfileCreated(title.trim(), slug.trim(), bio.trim());
    } catch (err: any) {
      setErrorMsg(err.message || '프로필을 생성하는 중 오류가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 p-6 shadow-2xl text-zinc-100">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 mb-4">
          <Sparkles className="w-4 h-4 text-white" />
          <h3 className="text-sm font-semibold tracking-wide text-white uppercase">
            포트폴리오 초기 프로필 설정
          </h3>
        </div>

        <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
          환영합니다! 공간 포트폴리오를 시작하기 위해 포트폴리오 제목과 고유 공유 주소를 설정해주세요.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              포트폴리오 제목 <span className="text-zinc-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: ARCHIVE : 나만의 공간 기록"
              required
              className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs text-white focus:outline-hidden focus:border-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              고유 주소 아이디 (slug) <span className="text-zinc-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'))}
                placeholder="my-archive"
                required
                className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs font-mono text-white focus:outline-hidden focus:border-white transition-colors"
              />
              <User className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-2.5" />
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">
              * 공유 URL: <code>?u={slug || 'your-slug'}&amp;mode=view</code>
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              소개글 (Bio)
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="당신의 아카이브에 대해 설명해주세요"
              className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs text-white focus:outline-hidden focus:border-white leading-relaxed transition-colors"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-red-400">{errorMsg}</p>
          )}

          <div className="pt-3 border-t border-zinc-800 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-black bg-white hover:bg-zinc-200 transition-colors cursor-pointer shadow-xs"
            >
              <span>{isSubmitting ? '생성 중...' : '포트폴리오 시작하기'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
