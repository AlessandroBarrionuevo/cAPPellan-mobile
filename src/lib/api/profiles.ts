import { request } from './client';
import { ENDPOINTS } from './endpoints';
import type {
  ChaplainTeamMember,
  ChaplainProfile,
  UpdateChaplainProfileRequest,
  BasicProfile,
  UpdateBasicProfileRequest,
} from '../../types/api';

/**
 * Section 7.1: Public Chaplain Team Directory ("Conocé a nuestro equipo").
 */
export async function getChaplainTeam(): Promise<ChaplainTeamMember[]> {
  try {
    const data = await request<ChaplainTeamMember[]>(ENDPOINTS.CHAPLAINS_TEAM);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('[ProfileApi] Failed to fetch chaplain team:', error);
    return [];
  }
}

/**
 * Section 7.2: View Specific Chaplain Profile.
 */
export async function getChaplainProfile(id: number): Promise<ChaplainProfile> {
  return request<ChaplainProfile>(ENDPOINTS.CHAPLAIN_PROFILE(id));
}

/**
 * Section 7.3: Update Chaplain Service Profile.
 */
export async function updateChaplainProfile(
  payload: UpdateChaplainProfileRequest
): Promise<ChaplainProfile> {
  return request<ChaplainProfile>(ENDPOINTS.PROFILE_CHAPLAIN, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Section 7.4: Get Current Basic User Profile.
 */
export async function getMyBasicProfile(): Promise<BasicProfile> {
  return request<BasicProfile>(ENDPOINTS.PROFILE_BASIC_ME);
}

/**
 * Section 7.5: Update Basic User Profile & Anonymity Privacy Toggle.
 */
export async function updateMyBasicProfile(
  payload: UpdateBasicProfileRequest
): Promise<BasicProfile> {
  return request<BasicProfile>(ENDPOINTS.PROFILE_BASIC_ME, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export interface FileUploadResponse {
  key: string;
  publicUrl: string;
  sizeBytes: number;
  contentType: string;
}

/**
 * Upload an avatar image directly to storage (Cloudflare R2 via backend).
 */
export async function uploadAvatarFile(uri: string): Promise<string> {
  const filename = uri.split('/').pop() || 'avatar.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const ext = match ? match[1].toLowerCase() : 'jpg';
  const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const formData = new FormData();
  formData.append('file', {
    uri,
    name: filename,
    type,
  } as any);
  formData.append('folder', 'avatars');

  const response = await request<FileUploadResponse>(ENDPOINTS.STORAGE_UPLOAD, {
    method: 'POST',
    body: formData,
  });

  return response.publicUrl || response.key;
}
