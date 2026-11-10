export interface GitHubEnvConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
}

export interface Space {
  id: string;
  name: string;
  location: string;
  tags: string[];
  comment: string;
  main_image_url: string;
  sub_image_urls: string[];
  created_at: string;
  updated_at?: string;
}

export interface SpaceFormData {
  name: string;
  location: string;
  tags: string[];
  comment: string;
  main_image_url: string;
  sub_image_urls: string[];
}
