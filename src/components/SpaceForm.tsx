import React, { useState, useRef } from 'react';
import { Space, SpaceFormData } from '../types';
import { convertToSquareJpegBlob } from '../lib/canvas';
import { isSupabaseConnected, uploadImageToSupabaseStorage } from '../lib/supabase';
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
  const [isPublic, setIsPublic] = useState(
    initialSpace?.is_public !== undefined ? initialSpace.is_public : true
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

  // Call Gemini AI server endpoint to search for address and recommended tags
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

      setAiSuccessMessage('Gemini 검색을 통해 세부 주소와 추천 해시태그를 불러왔습니다.');
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

  const handleMainImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMain(true);
    setFormError('');

    try {
      const { blob, dataUrl } = await convertToSquareJpegBlob(file, 1600);
      let finalUrl = dataUrl;

      if (isSupabaseConnected()) {
        try {
          finalUrl = await uploadImageToSupabaseStorage(blob, 'main');
        } catch (storageErr) {
          console.warn('Storage upload fallback to Data URL:', storageErr);
          finalUrl = dataUrl;
        }
      }

      setMainImageUrl(finalUrl);
    } catch (err: any) {
      console.error('Main image conversion failed:', err);
      setFormError('사진 정방형 변환에 실패했습니다: ' + err.message);
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

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const { blob, dataUrl } = await convertToSquareJpegBlob(file, 1600);

        let finalUrl = dataUrl;
        if (isSupabaseConnected()) {
          try {
            finalUrl = await uploadImageToSupabaseStorage(blob, `sub_${i}`);
          } catch (storageErr) {
            console.warn('Storage upload fallback to Data URL:', storageErr);
            finalUrl = dataUrl;
          }
        }
        newUrls.push(finalUrl);
      }

      setSubImageUrls((prev) => [...prev, ...newUrls]);
    } catch (err: any) {
      console.error('Sub image conversion failed:', err);
      setFormError('세부 사진 변환에 실패했습니다: ' + err.message);
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
        is_public: isPublic,
      });
    } catch (err: any) {
      console.error('Save failed:', err);
      setFormError(err.message || '저장 중 오류가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 text-zinc-100">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 mb-8 border-b border-zinc-800">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>취소하고 돌아가기</span>
        </button>

        <h1 className="text-sm font-bold uppercase tracking-wider text-white">
          {isEditMode ? '공간 정보 및 사진 수정' : '새로운 공간 기록 추가'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {formError && (
          <div className="p-4 bg-red-950/60 border border-red-800 flex items-center gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{formError}</span>
          </div>
        )}

        {/* 1. Place Name with AI Auto-fill Button */}
        <div>
          <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wide mb-2">
            장소명 (Space Name) <span className="text-zinc-400">*</span>
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
              className="flex-1 bg-zinc-900 border border-zinc-700 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-hidden focus:border-white transition-colors"
            />
            <button
              type="button"
              onClick={handleAiSuggest}
              disabled={isAiLoading || !name.trim()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-black bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed transition-colors shrink-0 cursor-pointer shadow-xs"
            >
              {isAiLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Gemini 검색 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>주소 및 태그 자동 완성</span>
                </>
              )}
            </button>
          </div>

          {aiSuccessMessage && (
            <p className="mt-2 text-xs text-zinc-300 font-medium flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-white" />
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

        {/* 2. Detailed Address */}
        <div>
          <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wide mb-2">
            세부 주소 (Location) <span className="text-zinc-400">*</span>
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="예: 서울특별시 종로구 북촌로 31-18 (Gemini로 자동 입력 가능)"
            required
            className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-hidden focus:border-white transition-colors"
          />
          <p className="mt-1.5 text-[11px] text-zinc-500">
            * 자동 완성된 주소는 사용자가 직접 수정하거나 보완할 수 있습니다.
          </p>
        </div>

        {/* 3. Hashtags */}
        <div>
          <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wide mb-2">
            해시태그 (Tags - 세부 화면에 표시)
          </label>

          <div className="flex flex-wrap items-center gap-2 mb-3 min-h-[36px] p-2 bg-zinc-950 border border-zinc-800">
            {tags.length === 0 ? (
              <span className="text-xs text-zinc-500">등록된 태그가 없습니다.</span>
            ) : (
              tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-200 bg-zinc-900 border border-zinc-700"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
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
              placeholder="태그 입력 후 Enter 또는 추가 버튼 클릭"
              className="flex-1 bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-hidden focus:border-white transition-colors"
            />
            <button
              type="button"
              onClick={() => handleAddTag()}
              className="px-3 py-1.5 text-xs font-semibold text-zinc-200 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 inline mr-1" />
              태그 추가
            </button>
          </div>
        </div>

        {/* 4. Comment / Note */}
        <div>
          <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wide mb-2">
            공간 코멘트 (Comment - 세부 화면에 표시)
          </label>
          <textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="이 공간에서 느낀 분위기, 건축적 요소, 빛과 가구의 조화, 또는 개인적인 사색을 자유롭게 기록해주세요."
            className="w-full bg-zinc-900 border border-zinc-700 p-3 text-sm text-white placeholder:text-zinc-500 focus:outline-hidden focus:border-white leading-relaxed transition-colors"
          />
        </div>

        {/* 5. Main Representative Photo with White Margin */}
        <div className="pt-4 border-t border-zinc-800">
          <div className="mb-2">
            <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wide">
              대표 사진 (Main Image - 1:1 정방형) <span className="text-zinc-400">*</span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            {/* Square Preview Container with Pristine White Margin */}
            <div className="w-40 h-40 aspect-square bg-white border border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 relative">
              {isUploadingMain ? (
                <div className="flex flex-col items-center justify-center p-2 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-800 mb-1" />
                  <span className="text-[10px] text-zinc-700">정방형 변환 중...</span>
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
                    className="absolute top-1 right-1 p-1 bg-black/70 text-white hover:bg-black transition-colors"
                    title="사진 지우기"
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
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-200 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{mainImageUrl ? '대표 사진 교체하기' : '대표 사진 업로드'}</span>
              </label>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                가로형 또는 세로형 사진도 원본이 잘리지 않고 가장 긴 변을 기준으로 순백의 화이트 여백(#FFFFFF)이 채워진 1:1 정방형 이미지로 자동 변환됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* 6. Sub Images Gallery with White Margin */}
        <div className="pt-4 border-t border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wide">
              세부 사진들 (Sub Images)
            </label>
            <span className="text-[11px] text-zinc-500">
              현재 {subImageUrls.length}장 등록됨
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-4">
            {subImageUrls.map((url, idx) => (
              <div
                key={idx}
                className="relative aspect-square bg-white border border-zinc-700 overflow-hidden group"
              >
                <img
                  src={url}
                  alt={`세부 사진 ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full aspect-square bg-white object-contain"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSubImage(idx)}
                  className="absolute top-1 right-1 p-1 bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
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
                className="w-full aspect-square border border-dashed border-zinc-700 hover:border-zinc-500 bg-zinc-950 flex flex-col items-center justify-center text-center p-2 cursor-pointer transition-colors"
              >
                {isUploadingSub ? (
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-300" />
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-zinc-500 mb-1" />
                    <span className="text-[10px] text-zinc-400 font-medium">사진 추가</span>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Submit and Cancel Actions (Moved to the left) */}
        <div className="flex items-center justify-start gap-3 pt-6 border-t border-zinc-800">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-black bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors cursor-pointer shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>처리 중...</span>
              </>
            ) : (
              <span>{isEditMode ? '수정 완료' : '추가 완료'}</span>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600 transition-colors cursor-pointer"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
};
