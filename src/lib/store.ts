import { Profile, Space, SpaceFormData } from '../types';
import { getSupabaseClient } from './supabase';

const KEY_LOCAL_PROFILE = 'space_portfolio_profile_v2';
const KEY_LOCAL_SPACES = 'space_portfolio_spaces_v2';

const SEED_GALLERY_IMG = '/src/assets/images/space_bauhaus_gallery_1794216285850.jpg';
const SEED_TEA_IMG = '/src/assets/images/space_tea_atelier_1794216284682.jpg';
const SEED_LIBRARY_IMG = '/src/assets/images/space_concrete_library_1794216284687.jpg';
const SEED_ROOFTOP_IMG = '/src/assets/images/space_rooftop_lounge_1794216284825.jpg';

export const DEFAULT_OWNER_ID = '00000000-0000-0000-0000-000000000001';

const DEFAULT_PROFILE: Profile = {
  id: DEFAULT_OWNER_ID,
  slug: 'minimal-archive',
  portfolio_title: 'SPACE ARCHIVE : 나만의 공간 기록',
  bio: '기능주의와 바우하우스의 정제된 미학을 바탕으로, 도시 곳곳에서 마주한 영감의 공간들을 1:1 정방형 앵글로 아카이빙합니다.',
  created_at: new Date('2026-01-01').toISOString(),
};

const DEFAULT_SPACES: Space[] = [
  {
    id: 'space-001',
    profile_id: DEFAULT_PROFILE.id,
    name: '아틀리에 아키브 (Atelier Archive)',
    location: '서울특별시 성동구 연무장길 45',
    tags: ['바우하우스', '성수아틀리에', '미니멀리즘', '콘크리트'],
    comment: '자연 채광과 노출 콘크리트, 바우하우스 의자가 빚어내는 정제된 질서감. 불필요한 장식을 덜어내고 빛과 공기의 흐름에 집중할 수 있는 갤러리 공간입니다.',
    main_image_url: SEED_GALLERY_IMG,
    sub_image_urls: [SEED_GALLERY_IMG, SEED_LIBRARY_IMG],
    is_public: true,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'space-002',
    profile_id: DEFAULT_PROFILE.id,
    name: '다실 청연 (Tea Atelier)',
    location: '서울특별시 종로구 삼청로 88',
    tags: ['삼청동', '현대다실', '대나무중정', '목재인테리어'],
    comment: '통창 너머 맑은 대나무 중정과 단정한 오크 원목 테이블. 정갈한 찻잔과 따뜻한 김이 머무는 곳으로, 도심의 소음을 차단하고 오롯이 마음에 집중하게 만듭니다.',
    main_image_url: SEED_TEA_IMG,
    sub_image_urls: [SEED_TEA_IMG, SEED_GALLERY_IMG],
    is_public: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'space-003',
    profile_id: DEFAULT_PROFILE.id,
    name: '모노리스 라이브러리 (Monolith Library)',
    location: '서울특별시 용산구 소월로 112',
    tags: ['브루탈리즘', '남산도서관', '독서공간', '건축기록'],
    comment: '격자형 천창에서 비치는 사선형 그림자와 천장까지 이어진 거대한 원목 서가. 공간 자체가 주는 묵직한 침묵 속에서 사색의 깊이를 더해줍니다.',
    main_image_url: SEED_LIBRARY_IMG,
    sub_image_urls: [SEED_LIBRARY_IMG, SEED_ROOFTOP_IMG],
    is_public: true,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'space-004',
    profile_id: DEFAULT_PROFILE.id,
    name: '테라스 루프 파빌리온 (Terrace Roof)',
    location: '서울특별시 강남구 도산대로 210',
    tags: ['도산공원', '루프탑라운지', '황혼뷰', '도심파빌리온'],
    comment: '차콜 컬러의 스틸 프레임과 순백 린넨 쿠션의 조화. 해질녘 빌딩 숲의 스카이라인이 프레임 속 한 폭의 추상화처럼 펼쳐지는 개방적인 루프탑 공간입니다.',
    main_image_url: SEED_ROOFTOP_IMG,
    sub_image_urls: [SEED_ROOFTOP_IMG, SEED_TEA_IMG],
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const KEY_LOCAL_PROFILES_LIST = 'space_portfolio_profiles_list_v4';

function getLocalProfilesList(): Profile[] {
  try {
    const raw = localStorage.getItem(KEY_LOCAL_PROFILES_LIST);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed reading local profiles list:', e);
  }
  const initial = [DEFAULT_PROFILE];
  try {
    localStorage.setItem(KEY_LOCAL_PROFILES_LIST, JSON.stringify(initial));
  } catch {}
  return initial;
}

function saveLocalProfileToList(profile: Profile): void {
  try {
    const list = getLocalProfilesList();
    const idx = list.findIndex((p) => p.id === profile.id);
    if (idx >= 0) {
      list[idx] = profile;
    } else {
      list.push(profile);
    }
    localStorage.setItem(KEY_LOCAL_PROFILES_LIST, JSON.stringify(list));
  } catch (e) {
    console.error('Failed saving profile to list:', e);
  }
}

function getLocalSpaces(): Space[] {
  try {
    const raw = localStorage.getItem(KEY_LOCAL_SPACES);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed reading local spaces:', e);
  }
  setLocalSpaces(DEFAULT_SPACES);
  return DEFAULT_SPACES;
}

function setLocalSpaces(spaces: Space[]): void {
  try {
    localStorage.setItem(KEY_LOCAL_SPACES, JSON.stringify(spaces));
  } catch (e) {
    console.error('Failed saving local spaces:', e);
  }
}

/**
 * Profile Operations
 */
export async function getProfile(slug?: string, currentUserId?: string): Promise<Profile | null> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      let query = supabase.from('profiles').select('*');
      if (slug) {
        query = query.eq('slug', slug);
      } else if (currentUserId) {
        query = query.eq('id', currentUserId);
      }
      const { data, error } = await query.limit(1).maybeSingle();
      if (!error && data) {
        return data as Profile;
      }
    } catch (e) {
      console.warn('Supabase profile query failed, using local fallback:', e);
    }
  }

  // Local storage lookup
  const profiles = getLocalProfilesList();

  if (currentUserId) {
    const matched = profiles.find((p) => p.id === currentUserId);
    if (matched) return matched;
    // CRITICAL: Do NOT fall back to DEFAULT_PROFILE if looking for a specific currentUserId
    return null;
  }

  if (slug) {
    const matched = profiles.find((p) => p.slug === slug);
    if (matched) return matched;
    return null;
  }

  // Only for unauthenticated / default demo visitor
  return DEFAULT_PROFILE;
}

export async function saveProfile(updates: Partial<Profile>, profileId?: string): Promise<Profile> {
  const targetId = profileId || updates.id;
  const profiles = getLocalProfilesList();
  const current = (targetId ? profiles.find((p) => p.id === targetId) : null) || profiles[0] || DEFAULT_PROFILE;

  const updated: Profile = {
    ...current,
    ...updates,
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert(updated, { onConflict: 'id' });
      if (error) {
        console.warn('Supabase profile upsert error:', error);
      }
    } catch (e) {
      console.warn('Supabase profile save failed:', e);
    }
  }

  saveLocalProfileToList(updated);
  return updated;
}

export async function createInitialProfile(
  userId: string,
  title: string,
  slug: string,
  bio: string
): Promise<Profile> {
  const newProfile: Profile = {
    id: userId,
    slug: slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
    portfolio_title: title.trim(),
    bio: bio.trim(),
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('profiles').insert([newProfile]);
      if (error) {
        console.warn('Supabase create profile error:', error);
      }
    } catch (e) {
      console.warn('Supabase insert profile failed:', e);
    }
  }

  saveLocalProfileToList(newProfile);
  return newProfile;
}

/**
 * Spaces Operations
 */
export async function getSpaces(profileId: string): Promise<Space[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return data as Space[];
      }
    } catch (e) {
      console.warn('Supabase spaces query failed, using local fallback:', e);
    }
  }

  // Fallback to local spaces: ONLY return spaces belonging to this profile_id
  const local = getLocalSpaces();
  const matched = local.filter((s) => s.profile_id === profileId);
  return matched;
}

export async function addSpace(data: SpaceFormData, profileId: string): Promise<Space> {
  const newSpace: Space = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `space-${Date.now()}`,
    profile_id: profileId,
    name: data.name.trim(),
    location: data.location.trim(),
    tags: data.tags,
    comment: data.comment.trim(),
    main_image_url: data.main_image_url,
    sub_image_urls: data.sub_image_urls,
    is_public: data.is_public,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('spaces').insert([newSpace]);
      if (error) {
        console.warn('Supabase space insert error:', error);
      }
    } catch (e) {
      console.warn('Supabase insert failed:', e);
    }
  }

  const existing = getLocalSpaces();
  const updated = [newSpace, ...existing];
  setLocalSpaces(updated);
  return newSpace;
}

export async function updateSpace(id: string, updates: Partial<SpaceFormData>): Promise<Space> {
  const existing = getLocalSpaces();
  const targetIndex = existing.findIndex((s) => s.id === id);
  if (targetIndex === -1) {
    throw new Error('해당 공간을 찾을 수 없습니다.');
  }

  const updatedSpace: Space = {
    ...existing[targetIndex],
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('spaces')
        .update(updatedSpace)
        .eq('id', id);
      if (error) {
        console.warn('Supabase space update error:', error);
      }
    } catch (e) {
      console.warn('Supabase update failed:', e);
    }
  }

  existing[targetIndex] = updatedSpace;
  setLocalSpaces([...existing]);
  return updatedSpace;
}

export async function deleteSpace(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('spaces').delete().eq('id', id);
      if (error) {
        console.warn('Supabase space delete error:', error);
      }
    } catch (e) {
      console.warn('Supabase delete failed:', e);
    }
  }

  const existing = getLocalSpaces();
  const filtered = existing.filter((s) => s.id !== id);
  setLocalSpaces(filtered);
}
