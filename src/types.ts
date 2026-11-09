export interface Profile {
  id: string; // Matches Supabase Auth user ID
  slug: string; // Unique portfolio identifier for URL (?u=slug)
  portfolio_title: string;
  bio: string;
  created_at: string;
}

export interface Space {
  id: string;
  profile_id: string; // References Profile.id
  name: string;
  location: string;
  tags: string[];
  comment: string;
  main_image_url: string;
  sub_image_urls: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpaceFormData {
  name: string;
  location: string;
  tags: string[];
  comment: string;
  main_image_url: string;
  sub_image_urls: string[];
  is_public: boolean;
}

export interface AuthSessionUser {
  id: string;
  email?: string;
  avatar_url?: string;
  full_name?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}
