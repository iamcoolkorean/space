import React, { useState, useEffect, useRef } from 'react';
import { Lock, X, AlertCircle, KeyRound } from 'lucide-react';
import { verifyAdminPassword, setAdminAuthenticated } from '../lib/github';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({
  isOpen,
  onSuccess,
  onClose,
}) => {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setErrorMsg('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('관리자 비밀번호를 입력해주세요.');
      return;
    }

    if (verifyAdminPassword(password)) {
      setAdminAuthenticated(true);
      setPassword('');
      setErrorMsg('');
      onSuccess();
      onClose();
    } else {
      setErrorMsg('비밀번호가 일치하지 않습니다.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#0A0A0A] border border-[#27272A] p-6 shadow-2xl text-white font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#27272A] pb-3 mb-5">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-xs font-bold tracking-widest text-white uppercase">
              ADMIN AUTHENTICATION
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#A1A1AA] mb-4 leading-relaxed">
          공간 기록을 추가하거나 수정·삭제하려면 관리자 비밀번호를 입력해주세요.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider mb-1.5">
              비밀번호 (Password)
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="관리자 비밀번호 입력"
                className="w-full bg-zinc-950 border border-[#27272A] px-3 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-hidden focus:border-[#2563EB] transition-colors"
              />
              <KeyRound className="w-3.5 h-3.5 text-zinc-600 absolute right-3 top-3" />
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-2 border-t border-[#27272A] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#A1A1AA] hover:text-white border border-[#27272A] hover:border-zinc-600 transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-500 transition-colors cursor-pointer"
            >
              인증하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
