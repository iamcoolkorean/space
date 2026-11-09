import React, { useState } from 'react';
import { X, LogIn, Mail, Lock, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import {
  signInWithEmailPassword,
  signUpWithEmailPassword,
  signInDemoUser,
  isSupabaseConnected,
} from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user?: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (tab === 'signin') {
        const res = await signInWithEmailPassword(email.trim(), password);
        onAuthSuccess(res?.user);
        onClose();
      } else {
        const res = await signUpWithEmailPassword(email.trim(), password);
        if (isSupabaseConnected()) {
          setSuccessMsg('회원가입 이메일이 발송되었거나 계정이 생성되었습니다. 확인 후 로그인해주세요.');
        } else {
          onAuthSuccess(res?.user);
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || '인증 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = () => {
    const res = signInDemoUser();
    onAuthSuccess({
      id: res.user.id,
      email: res.user.email,
      avatar_url: res.user.user_metadata?.avatar_url,
      full_name: res.user.user_metadata?.full_name,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 p-6 shadow-2xl text-zinc-100">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <LogIn className="w-4 h-4 text-white" />
            <h3 className="text-sm font-semibold tracking-wide text-white uppercase">
              SPACE ARCHIVE 로그인
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher: 로그인 vs 회원가입 */}
        <div className="flex border-b border-zinc-800 mb-5">
          <button
            type="button"
            onClick={() => {
              setTab('signin');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs font-semibold text-center transition-colors cursor-pointer ${
              tab === 'signin'
                ? 'text-white border-b-2 border-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs font-semibold text-center transition-colors cursor-pointer ${
              tab === 'signup'
                ? 'text-white border-b-2 border-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            회원가입
          </button>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3.5 mb-5">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              이메일 주소
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-hidden focus:border-white transition-colors"
              />
              <Mail className="w-3.5 h-3.5 text-zinc-600 absolute right-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              비밀번호
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-hidden focus:border-white transition-colors"
              />
              <Lock className="w-3.5 h-3.5 text-zinc-600 absolute right-3 top-2.5" />
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <p className="text-xs text-zinc-300 leading-relaxed">{successMsg}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 text-xs font-semibold text-black bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : tab === 'signin' ? (
              '이메일로 로그인'
            ) : (
              '회원가입 완료'
            )}
          </button>
        </form>

        <div className="border-t border-zinc-800 pt-4">
          <button
            type="button"
            onClick={handleDemoSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-200 hover:text-white transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            <span>베타 테스트용 계정으로 시작</span>
          </button>
        </div>
      </div>
    </div>
  );
};
