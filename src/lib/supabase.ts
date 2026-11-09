import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { SupabaseConfig } from '../types';

export const STORAGE_KEY_CONFIG = 'space_portfolio_supabase_config';
export const STORAGE_KEY_DEMO_USER = 'space_portfolio_demo_user';

export function getDemoUser(): any {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEMO_USER);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey };
  }

  try {
    const local = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (local) {
      return JSON.parse(local);
    }
  } catch (e) {
    console.error('Error reading Supabase config from localStorage:', e);
  }

  return { url: '', anonKey: '' };
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const config = getStoredSupabaseConfig();
  if (config.url && config.anonKey) {
    try {
      cachedClient = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      return cachedClient;
    } catch (e) {
      console.error('Failed to create Supabase client:', e);
      return null;
    }
  }
  return null;
}

export function isSupabaseConnected(): boolean {
  return getSupabaseClient() !== null;
}

/**
 * Authentication Methods
 */

export function getAuthSessionSync(): { user: User | null } {
  try {
    const demoRaw = localStorage.getItem(STORAGE_KEY_DEMO_USER);
    if (demoRaw) {
      return { user: JSON.parse(demoRaw) };
    }
  } catch {}
  return { user: null };
}

export async function getAuthSession(): Promise<{ session: Session | null; user: User | null }> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.auth.getSession();
      if (!error && data.session) {
        return { session: data.session, user: data.session.user };
      }
    } catch (e) {
      console.warn('Supabase getSession failed:', e);
    }
  }

  // Fallback to local demo session if active
  return { session: null, ...getAuthSessionSync() };
}

export async function signInWithOAuth(provider: 'google' | 'github') {
  const client = getSupabaseClient();
  if (!client) {
    // If Supabase credentials are not connected, sign in as demo user for instant preview
    return signInDemoUser();
  }

  const { data, error } = await client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin,
    },
  });

  if (error) {
    console.error('OAuth sign in error:', error);
    throw error;
  }
  return data;
}

export async function signInWithEmailPassword(email: string, password: string) {
  const client = getSupabaseClient();
  if (!client) {
    return signInDemoUser(email);
  }

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }
  return data;
}

export async function signUpWithEmailPassword(email: string, password: string) {
  const client = getSupabaseClient();
  if (!client) {
    return signInDemoUser(email);
  }

  const { data, error } = await client.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw error;
  }
  return data;
}

export async function signOutUser(): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.auth.signOut();
    } catch (e) {
      console.warn('Supabase sign out error:', e);
    }
  }
  try {
    localStorage.removeItem(STORAGE_KEY_DEMO_USER);
  } catch {}
}

export function signInDemoUser(customEmail?: string) {
  const demoUser: User = {
    id: '00000000-0000-0000-0000-000000000001',
    email: customEmail || 'owner@spacearchive.design',
    app_metadata: {},
    user_metadata: { full_name: 'Space Curator' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as any;

  try {
    localStorage.setItem(STORAGE_KEY_DEMO_USER, JSON.stringify(demoUser));
  } catch {}
  return { user: demoUser };
}

/**
 * Uploads a square JPEG Blob to Supabase Storage bucket 'space-images'
 */
export async function uploadImageToSupabaseStorage(
  blob: Blob,
  prefix: string = 'space'
): Promise<string> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase가 설정되지 않았습니다.');
  }

  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 9);
  const filePath = `spaces/${prefix}_${timestamp}_${randomStr}.jpg`;

  const { data, error } = await client.storage
    .from('space-images')
    .upload(filePath, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) {
    console.error('Supabase Storage upload error:', error);
    throw new Error(`스토리지 업로드 실패: ${error.message}`);
  }

  const { data: publicUrlData } = client.storage
    .from('space-images')
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

export const SUPABASE_SQL_SCHEMA = `-- [Supabase Data, Auth & Storage Schema]
-- 1. profiles 테이블 (auth.users와 1:1 연동)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  portfolio_title TEXT NOT NULL,
  bio TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. spaces 테이블
CREATE TABLE IF NOT EXISTS public.spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  comment TEXT DEFAULT '',
  main_image_url TEXT NOT NULL,
  sub_image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security (RLS) 및 권한 검증 정책
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public read spaces" ON public.spaces FOR SELECT USING (true);
CREATE POLICY "Users can insert own spaces" ON public.spaces FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can update own spaces" ON public.spaces FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "Users can delete own spaces" ON public.spaces FOR DELETE USING (auth.uid() = profile_id);

-- 4. space-images 스토리지 버킷 생성 및 공개 접근
INSERT INTO storage.buckets (id, name, public)
VALUES ('space-images', 'space-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access space-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'space-images');

CREATE POLICY "Authenticated users can upload space-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'space-images');
`;
