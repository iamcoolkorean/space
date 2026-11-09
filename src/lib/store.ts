import { Profile, Space, SpaceFormData } from '../types';
import { getSupabaseClient } from './supabase';

const KEY_LOCAL_PROFILE = 'space_portfolio_profile_v3';
const KEY_LOCAL_SPACES = 'space_portfolio_spaces_v5';

export const DEFAULT_OWNER_ID = '00000000-0000-0000-0000-000000000001';

const DEFAULT_PROFILE: Profile = {
  id: DEFAULT_OWNER_ID,
  slug: 'beta-archive',
  portfolio_title: '나만의 공간 아카이브',
  bio: '당신의 아카이브에 대해 설명해주세요',
  created_at: new Date('2026-01-01').toISOString(),
};

const DEFAULT_SPACES: Space[] = [];

const KEY_LOCAL_PROFILES_LIST = 'space_portfolio_profiles_list_v6';

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
