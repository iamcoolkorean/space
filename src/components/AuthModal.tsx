import React, { useState } from 'react';
import { X, LogIn, Mail, Lock, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import {
  signInWithOAuth,
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

  const handleOAuth = async (provider: 'google' | 'github') => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res: any = await signInWithOAuth(provider);
      onAuthSuccess(res?.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || `${provider} 로그인에 실패했습니다.`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 p-6 shadow-2xl text-zinc-100">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <LogIn className="w-4 h-4 text-blue-400" />
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
                ? 'text-white border-b-2 border-blue-500'
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
                ? 'text-white border-b-2 border-blue-500'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            회원가입
          </button>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-2.5 mb-5">
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2.5 py-2 px-3 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-white transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google 계정으로 계속하기</span>
          </button>

          <button
            type="button"
            onClick={handleDemoSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-blue-500/30 bg-blue-950/20 hover:bg-blue-950/40 text-xs font-semibold text-blue-400 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>큐레이터 체험 계정으로 시작</span>
          </button>
        </div>

        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-zinc-800"></div>
          <span className="px-3 text-[11px] text-zinc-500 uppercase">또는 이메일</span>
          <div className="flex-1 border-t border-zinc-800"></div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3.5">
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
                className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-hidden focus:border-blue-500"
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
                className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-hidden focus:border-blue-500"
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
            <p className="text-xs text-blue-400 leading-relaxed">{successMsg}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : tab === 'signin' ? (
              '로그인'
            ) : (
              '회원가입 완료'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
