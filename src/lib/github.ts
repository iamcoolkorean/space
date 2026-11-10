import { GitHubEnvConfig, Space } from '../types';

export const STORAGE_KEY_ADMIN_AUTH = 'space_archive_admin_authenticated_v1';
export const STORAGE_KEY_LOCAL_SPACES = 'space_archive_spaces_cache_v1';

/**
 * Load build-time environment variables via import.meta.env
 */
export function getGitHubEnvConfig(): GitHubEnvConfig {
  const env = (import.meta as any).env || {};
  const owner = (env.VITE_GITHUB_OWNER || '').trim();
  const repo = (env.VITE_GITHUB_REPO || '').trim();
  const branch = (env.VITE_GITHUB_BRANCH || 'main').trim() || 'main';
  const token = (env.VITE_GITHUB_TOKEN || '').trim();

  return {
    owner: owner === 'MY_GITHUB_OWNER' ? '' : owner,
    repo: repo === 'MY_GITHUB_REPO' ? '' : repo,
    branch,
    token: token === 'MY_GITHUB_TOKEN' ? '' : token,
  };
}

export function isGitHubEnvConfigured(): boolean {
  const { owner, repo, token } = getGitHubEnvConfig();
  return Boolean(owner && repo && token);
}

/**
 * Admin Password Verification (Default: 1q2w3e4r!!)
 */
export function getExpectedAdminPassword(): string {
  const env = (import.meta as any).env || {};
  const configured = (env.VITE_ADMIN_PASSWORD || '').trim();
  return configured || '1q2w3e4r!!';
}

export function verifyAdminPassword(inputPassword: string): boolean {
  const expected = getExpectedAdminPassword();
  return inputPassword === expected;
}

export function isAdminAuthenticated(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_ADMIN_AUTH) === 'true';
  } catch {
    return false;
  }
}

export function setAdminAuthenticated(isAuthenticated: boolean): void {
  try {
    if (isAuthenticated) {
      localStorage.setItem(STORAGE_KEY_ADMIN_AUTH, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEY_ADMIN_AUTH);
    }
  } catch (e) {
    console.error('Failed to update admin auth state in localStorage:', e);
  }
}

/**
 * UTF-8 safe Base64 helpers
 */
export function utf8ToBase64(str: string): string {
  try {
    return window.btoa(unescape(encodeURIComponent(str)));
  } catch {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

export function base64ToUtf8(base64Str: string): string {
  try {
    const clean = base64Str.replace(/\s+/g, '');
    return decodeURIComponent(escape(window.atob(clean)));
  } catch {
    const clean = base64Str.replace(/\s+/g, '');
    const binary = window.atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }
}

/**
 * 1. Read Spaces Data
 * - Fetches public/data/spaces.json directly via fetch
 * - If GitHub Contents API is configured, fetches latest committed spaces.json & SHA
 */
export async function fetchSpacesData(): Promise<{ spaces: Space[]; sha?: string }> {
  const config = getGitHubEnvConfig();

  // Attempt GitHub Contents API first if owner & repo are configured
  if (config.owner && config.repo) {
    try {
      const apiUrl = `https://api.github.com/repos/${encodeURIComponent(
        config.owner
      )}/${encodeURIComponent(config.repo)}/contents/public/data/spaces.json?ref=${encodeURIComponent(
        config.branch
      )}&_t=${Date.now()}`;

      const headers: Record<string, string> = {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      };
      if (config.token) {
        headers.Authorization = `Bearer ${config.token}`;
      }

      const res = await fetch(apiUrl, { headers, cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.content) {
          const decoded = base64ToUtf8(data.content);
          const parsed = JSON.parse(decoded);
          if (Array.isArray(parsed)) {
            try {
              localStorage.setItem(STORAGE_KEY_LOCAL_SPACES, JSON.stringify(parsed));
            } catch {}
            return { spaces: parsed, sha: data.sha };
          }
        }
      } else if (res.status === 404) {
        return { spaces: [], sha: undefined };
      }
    } catch (err) {
      console.warn('GitHub Contents API read fallback to static fetch:', err);
    }
  }

  // Check localStorage cache if updated during current session without GitHub token
  try {
    const cached = localStorage.getItem(STORAGE_KEY_LOCAL_SPACES);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { spaces: parsed, sha: undefined };
      }
    }
  } catch {}

  // Direct fetch of public/data/spaces.json
  const candidatePaths = ['/data/spaces.json', 'public/data/spaces.json'];
  for (const path of candidatePaths) {
    try {
      const response = await fetch(`${path}?_t=${Date.now()}`, { cache: 'no-store' });
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json') || contentType.includes('text/plain')) {
          const parsed = await response.json();
          if (Array.isArray(parsed)) {
            return { spaces: parsed, sha: undefined };
          }
        }
      }
    } catch {
      // try next path
    }
  }

  return { spaces: [], sha: undefined };
}

/**
 * 2. Upload Square JPEG Image to GitHub Contents API
 * PUT /repos/{owner}/{repo}/contents/public/uploads/{timestamp}_{index}.jpg
 */
export async function uploadImageToGitHub(
  dataUrl: string,
  timestamp: number,
  indexLabel: string | number
): Promise<string> {
  const config = getGitHubEnvConfig();

  // If GitHub env vars are not configured, fallback to DataURL so preview remains functional
  if (!config.owner || !config.repo || !config.token) {
    return dataUrl;
  }

  const cleanBase64 = dataUrl.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
  const filename = `${timestamp}_${indexLabel}.jpg`;
  const filePath = `public/uploads/${filename}`;
  const url = `https://api.github.com/repos/${encodeURIComponent(
    config.owner
  )}/${encodeURIComponent(config.repo)}/contents/${filePath}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      message: `chore(uploads): add image ${filename}`,
      content: cleanBase64,
      branch: config.branch,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      errData.message || `GitHub 이미지 업로드 실패 (HTTP ${response.status})`
    );
  }

  const result = await response.json();
  return (
    result.content?.download_url ||
    `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${filePath}`
  );
}

/**
 * Delete an uploaded image from GitHub Contents API if it resides in public/uploads/
 */
export async function deleteImageFromGitHub(imageUrl: string): Promise<void> {
  const config = getGitHubEnvConfig();
  if (!config.owner || !config.repo || !config.token) return;

  const match = imageUrl.match(/public\/uploads\/([^?#]+)/);
  if (!match) return;

  const filePath = `public/uploads/${match[1]}`;
  const apiUrl = `https://api.github.com/repos/${encodeURIComponent(
    config.owner
  )}/${encodeURIComponent(config.repo)}/contents/${filePath}`;

  try {
    // 1. Get file SHA
    const getRes = await fetch(
      `${apiUrl}?ref=${encodeURIComponent(config.branch)}`,
      {
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );
    if (!getRes.ok) return;
    const fileInfo = await getRes.json();
    if (!fileInfo.sha) return;

    // 2. Delete file commit
    await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        message: `chore(uploads): delete image ${match[1]}`,
        sha: fileInfo.sha,
        branch: config.branch,
      }),
    });
  } catch (e) {
    console.warn('Failed to delete image from GitHub:', e);
  }
}

/**
 * 3. Commit updated spaces.json to GitHub Contents API
 * Fetches latest SHA & content of public/data/spaces.json and sends PUT request
 */
export async function commitSpacesJson(
  updatedSpaces: Space[],
  commitMessage: string
): Promise<{ spaces: Space[]; sha?: string }> {
  const config = getGitHubEnvConfig();

  // Always save to localStorage cache so UI stays in sync immediately
  try {
    localStorage.setItem(STORAGE_KEY_LOCAL_SPACES, JSON.stringify(updatedSpaces));
  } catch {}

  if (!config.owner || !config.repo || !config.token) {
    return { spaces: updatedSpaces, sha: undefined };
  }

  const filePath = 'public/data/spaces.json';
  const apiUrl = `https://api.github.com/repos/${encodeURIComponent(
    config.owner
  )}/${encodeURIComponent(config.repo)}/contents/${filePath}`;

  // Fetch latest SHA before committing to avoid 409 Conflict
  let latestSha: string | undefined = undefined;
  try {
    const shaRes = await fetch(
      `${apiUrl}?ref=${encodeURIComponent(config.branch)}&_t=${Date.now()}`,
      {
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        cache: 'no-store',
      }
    );
    if (shaRes.ok) {
      const shaData = await shaRes.json();
      latestSha = shaData.sha;
    }
  } catch (e) {
    console.warn('Could not fetch existing spaces.json SHA:', e);
  }

  const jsonContent = JSON.stringify(updatedSpaces, null, 2);
  const encodedContent = utf8ToBase64(jsonContent);

  const payload: Record<string, any> = {
    message: commitMessage,
    content: encodedContent,
    branch: config.branch,
  };
  if (latestSha) {
    payload.sha = latestSha;
  }

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify(payload),
  });

  if (!putRes.ok) {
    const errData = await putRes.json().catch(() => ({}));
    throw new Error(
      errData.message || `spaces.json GitHub 커밋 실패 (HTTP ${putRes.status})`
    );
  }

  const result = await putRes.json();
  return {
    spaces: updatedSpaces,
    sha: result.content?.sha,
  };
}
