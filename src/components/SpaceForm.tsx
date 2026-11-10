import React, { useState, useRef } from 'react';
import { Space, SpaceFormData } from '../types';
import { convertToSquareJpegBlob } from '../lib/canvas';
import { uploadImageToGitHub } from '../lib/github';
import {
  Sparkles,
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  Plus,
  ArrowLeft,
  Check,
  AlertCircle,
} from 'lucide-react';

interface SpaceFormProps {
  initialSpace?: Space | null;
  onSave: (data: SpaceFormData) => Promise<void>;
  onCancel: () => void;
}

export const SpaceForm: React.FC<SpaceFormProps> = ({
  initialSpace,
  onSave,
  onCancel,
}) => {
  const isEditMode = Boolean(initialSpace);

  // Form states
  const [name, setName] = useState(initialSpace?.name || '');
  const [location, setLocation] = useState(initialSpace?.location || '');
  const [tags, setTags] = useState<string[]>(initialSpace?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [comment, setComment] = useState(initialSpace?.comment || '');
  const [mainImageUrl, setMainImageUrl] = useState(initialSpace?.main_image_url || '');
  const [subImageUrls, setSubImageUrls] = useState<string[]>(
    initialSpace?.sub_image_urls || []
  );

  // UI processing states
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiSuccessMessage, setAiSuccessMessage] = useState('');
  const [isUploadingMain, setIsUploadingMain] = useState(false);
  const [isUploadingSub, setIsUploadingSub] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const subFileInputRef = useRef<HTMLInputElement>(null);

  // Gemini 2.5 Flash (googleSearch enabled) auto-complete for road address and hashtags
  const handleAiSuggest = async () => {
    if (!name.trim()) {
      setAiError('먼저 장소명을 입력해주세요.');
      return;
    }

    setIsAiLoading(true);
    setAiError('');
    setAiSuccessMessage('');

    try {
      const response = await fetch('/api/suggest-space', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || '장소 검색에 실패했습니다.');
      }

      const data = await response.json();

      if (data.location) {
        setLocation(data.location);
      }

      if (Array.isArray(data.tags) && data.tags.length > 0) {
        const newTags = Array.from(new Set([...tags, ...data.tags]));
        setTags(newTags);
      }

      setAiSuccessMessage('Gemini 2.5 Flash 검색을 통해 도로명 주소와 추천 해시태그를 자동 입력했습니다.');
      setTimeout(() => setAiSuccessMessage(''), 4000);
    } catch (err: any) {
      console.error('AI suggest error:', err);
      setAiError(err.message || 'AI 추천을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = tagInput.trim().replace(/^#/, '');
    if (!clean) return;
    if (!tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Convert to 1600x1600 1:1 white-padded JPEG and commit via GitHub Contents API
  const handleMainImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMain(true);
    setFormError('');

    try {
      const { dataUrl } = await convertToSquareJpegBlob(file, 1600);
      const timestamp = Date.now();
      const uploadedUrl = await uploadImageToGitHub(dataUrl, timestamp, 0);
      setMainImageUrl(uploadedUrl);
    } catch (err: any) {
      console.error('Main image upload failed:', err);
      setFormError('대표 사진 업로드 실패: ' + err.message);
    } finally {
      setIsUploadingMain(false);
      if (mainFileInputRef.current) mainFileInputRef.current.value = '';
    }
  };

  const handleSubImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingSub(true);
    setFormError('');

    try {
      const newUrls: string[] = [];
      const timestamp = Date.now();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const { dataUrl } = await convertToSquareJpegBlob(file, 1600);
        const uploadedUrl = await uploadImageToGitHub(
          dataUrl,
          timestamp,
          subImageUrls.length + i + 1
        );
        newUrls.push(uploadedUrl);
      }

      setSubImageUrls((prev) => [...prev, ...newUrls]);
    } catch (err: any) {
      console.error('Sub images upload failed:', err);
      setFormError('세부 사진 업로드 실패: ' + err.message);
    } finally {
      setIsUploadingSub(false);
      if (subFileInputRef.current) subFileInputRef.current.value = '';
    }
  };

  const handleRemoveSubImage = (indexToRemove: number) => {
    setSubImageUrls(subImageUrls.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('장소명을 입력해주세요.');
      return;
    }
    if (!location.trim()) {
      setFormError('세부 주소를 입력해주세요.');
      return;
    }
    if (!mainImageUrl) {
      setFormError('대표 정방형 사진을 1장 이상 등록해주세요.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      await onSave({
        name: name.trim(),
        location: location.trim(),
        tags,
        comment: comment.trim(),
        main_image_url: mainImageUrl,
        sub_image_urls: subImageUrls,
      });
    } catch (err: any) {
      console.error('Save failed:', err);
      setFormError(err.message || '저장 중 오류가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 text-white font-sans w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 mb-8 border-b border-[#27272A]">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-xs font-semibold text-[#A1A1AA] hover:text-white transition-colors uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>취소하고 돌아가기</span>
        </button>

        <h1 className="text-xs font-bold uppercase tracking-widest text-white">
          {isEditMode ? '공간 기록 수정' : '새 공간 기록 추가'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {formError && (
          <div className="p-4 bg-red-950/50 border border-red-800 flex items-center gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{formError}</span>
          </div>
        )}

        {/* 1. Place Name with Gemini 2.5 Flash Auto-complete */}
        <div>
          <label className="block text-xs font-bold text-white uppercase tracking-wide mb-2">
            장소명 (Space Name) <span className="text-[#2563EB]">*</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setAiError('');
              }}
              placeholder="예: 아틀리에 아키브, 블루보틀 삼청, 성수 어니언"
              required
              className="flex-1 bg-zinc-950 border border-[#27272A] px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-hidden focus:border-[#2563EB] transition-colors"
            />
            <button
              type="button"
              onClick={handleAiSuggest}
              disabled={isAiLoading || !name.trim()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-500 disabled:bg-zinc-900 disabled:text-zinc-600 disabled:border disabled:border-[#27272A] disabled:cursor-not-allowed transition-colors shrink-0 cursor-pointer"
            >
              {isAiLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Gemini 검색 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>주소 및 태그 자동완성</span>
                </>
              )}
            </button>
          </div>

          {aiSuccessMessage && (
            <p className="mt-2 text-xs text-blue-400 font-medium flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>{aiSuccessMessage}</span>
            </p>
          )}

          {aiError && (
            <p className="mt-2 text-xs text-red-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{aiError}</span>
            </p>
          )}
        </div>

        {/* 2. Road Address */}
        <div>
          <label className="block text-xs font-bold text-white uppercase tracking-wide mb-2">
            세부 주소 (Location) <span className="text-[#2563EB]">*</span>
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="예: 서울특별시 종로구 북촌로5길 76"
            required
            className="w-full bg-zinc-950 border border-[#27272A] px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-hidden focus:border-[#2563EB] transition-colors"
          />
        </div>

        {/* 3. Hashtags (Zero-Pill Rectangular Blocks) */}
        <div>
          <label className="block text-xs font-bold text-white uppercase tracking-wide mb-2">
            해시태그 (Tags)
          </label>

          <div className="flex flex-wrap items-center gap-2 mb-3 min-h-[38px] p-2.5 bg-zinc-950 border border-[#27272A]">
            {tags.length === 0 ? (
              <span className="text-xs text-[#A1A1AA]">등록된 태그가 없습니다.</span>
            ) : (
              tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-white bg-[#0A0A0A] border border-[#27272A]"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-[#A1A1AA] hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="태그 입력 후 Enter 또는 추가 클릭"
              className="flex-1 bg-zinc-950 border border-[#27272A] px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-hidden focus:border-[#2563EB] transition-colors"
            />
            <button
              type="button"
              onClick={() => handleAddTag()}
              className="px-3.5 py-2 text-xs font-semibold text-white border border-[#27272A] hover:border-[#2563EB] transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 inline mr-1" />
              태그 추가
            </button>
          </div>
        </div>

        {/* 4. Contemplative Comment */}
        <div>
          <label className="block text-xs font-bold text-white uppercase tracking-wide mb-2">
            사색 코멘트 (Comment)
          </label>
          <textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="이 공간에서 마주한 빛과 질감, 건축적 비례, 또는 사색의 기록을 남겨주세요."
            className="w-full bg-zinc-950 border border-[#27272A] p-3 text-sm text-white placeholder:text-zinc-600 focus:outline-hidden focus:border-[#2563EB] leading-relaxed transition-colors"
          />
        </div>

        {/* 5. Main Representative Photo (1:1 White Matting) */}
        <div className="pt-4 border-t border-[#27272A]">
          <div className="mb-2">
            <label className="block text-xs font-bold text-white uppercase tracking-wide">
              대표 사진 (Main Image - 1:1 정방형) <span className="text-[#2563EB]">*</span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="w-40 h-40 aspect-square bg-white border border-[#27272A] flex items-center justify-center overflow-hidden shrink-0 relative">
              {isUploadingMain ? (
                <div className="flex flex-col items-center justify-center p-2 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#2563EB] mb-1" />
                  <span className="text-[10px] text-zinc-700 font-medium">업로드 중...</span>
                </div>
              ) : mainImageUrl ? (
                <>
                  <img
                    src={mainImageUrl}
                    alt="대표 사진 미리보기"
                    referrerPolicy="no-referrer"
                    className="w-full h-full aspect-square bg-white object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setMainImageUrl('')}
                    className="absolute top-1 right-1 p-1 bg-black/80 text-white hover:bg-black transition-colors cursor-pointer"
                    title="사진 제거"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-3 text-center text-zinc-400">
                  <ImageIcon className="w-7 h-7 mb-1 stroke-1" />
                  <span className="text-[11px]">사진 없음</span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <input
                ref={mainFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleMainImageChange}
                className="hidden"
                id="main-photo-upload"
              />
              <label
                htmlFor="main-photo-upload"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white border border-[#27272A] hover:border-[#2563EB] bg-zinc-950 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>{mainImageUrl ? '대표 사진 변경' : '대표 사진 업로드'}</span>
              </label>
              <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                업로드 시 브라우저 Canvas를 통해 최대 1600×1600px 크기의 1:1 정방형 순백색(#FFFFFF) 여백 이미지로 변환되어 GitHub 저장소에 커밋됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* 6. Sub Images Gallery */}
        <div className="pt-4 border-t border-[#27272A]">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-white uppercase tracking-wide">
              서브 사진 (Sub Images)
            </label>
            <span className="text-[11px] text-[#A1A1AA]">
              {subImageUrls.length}장 등록됨
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-4">
            {subImageUrls.map((url, idx) => (
              <div
                key={idx}
                className="relative aspect-square bg-white border border-[#27272A] overflow-hidden group"
              >
                <img
                  src={url}
                  alt={`서브 사진 ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full aspect-square bg-white object-contain"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSubImage(idx)}
                  className="absolute top-1 right-1 p-1 bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black cursor-pointer"
                  title="사진 삭제"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            <div>
              <input
                ref={subFileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleSubImagesChange}
                className="hidden"
                id="sub-photos-upload"
              />
              <label
                htmlFor="sub-photos-upload"
                className="w-full aspect-square border border-dashed border-[#27272A] hover:border-[#2563EB] bg-zinc-950 flex flex-col items-center justify-center text-center p-2 cursor-pointer transition-colors"
              >
                {isUploadingSub ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" />
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-[#A1A1AA] mb-1" />
                    <span className="text-[10px] text-[#A1A1AA] font-medium">사진 추가</span>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Submit and Cancel Actions (Left-aligned) */}
        <div className="flex items-center justify-start gap-3 pt-6 border-t border-[#27272A]">
          <button
            type="submit"
            disabled={isSubmitting || isUploadingMain || isUploadingSub}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-500 disabled:bg-zinc-900 disabled:text-zinc-600 transition-colors cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>GitHub 커밋 중...</span>
              </>
            ) : (
              <span>{isEditMode ? '수정 완료' : '추가 완료'}</span>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-xs font-semibold text-[#A1A1AA] hover:text-white border border-[#27272A] hover:border-zinc-600 transition-colors cursor-pointer"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
};
