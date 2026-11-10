// Browser helpers for the scooper job screens. Requests use the accessToken
// cookie set at login, so no Authorization header is needed.

// Matches MAX_PROXY_UPLOAD_BYTES / MAX_PHOTO_BYTES in src/lib/service-photos.js.
export const MAX_PROXY_UPLOAD_BYTES = 4 * 1024 * 1024;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

const EXTENSION_TYPES = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif' };

export class JobApiError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message);
    this.name = 'JobApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(url, options = {}, fetchImpl = fetch) {
  const response = await fetchImpl(url, { credentials: 'same-origin', ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new JobApiError(data.message || data.error || `Request failed (${response.status})`, {
      status: response.status,
      code: data.code,
      details: data,
    });
  }
  return data;
}

const json = (body) => ({ headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });

/** Some phones report HEIC photos with an empty type; fall back to the extension. */
export function photoContentType(file) {
  if (file.type) return file.type;
  const ext = String(file.name || '').split('.').pop().toLowerCase();
  return EXTENSION_TYPES[ext] || 'application/octet-stream';
}

export const getJob = (serviceId, fetchImpl) => request(`/api/services/${serviceId}`, {}, fetchImpl);

export const listJobPhotos = (serviceId, fetchImpl) =>
  request(`/api/employee/services/${serviceId}/photos`, {}, fetchImpl);

export const saveJobChecklist = (serviceId, checklist, notes, fetchImpl) =>
  request(`/api/services/${serviceId}/checklist`, { method: 'POST', ...json({ checklist, notes }) }, fetchImpl);

export const completeJob = (serviceId, { checklist, notes } = {}, fetchImpl) =>
  request(`/api/employee/services/${serviceId}/complete`, { method: 'POST', ...json({ checklist, notes }) }, fetchImpl);

export const claimJob = (serviceId, fetchImpl) =>
  request(`/api/employee/services/${serviceId}/claim`, { method: 'POST' }, fetchImpl);

function currentPosition(geolocation) {
  if (!geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  });
}

/**
 * Checks in with the phone's location (the server requires it when the job
 * has coordinates). If location is unavailable the server says so.
 */
export async function checkInToJob(serviceId, { geolocation = globalThis.navigator?.geolocation, fetchImpl } = {}) {
  const position = await currentPosition(geolocation);
  return request(`/api/employee/services/${serviceId}/arrive`, { method: 'POST', ...json(position || {}) }, fetchImpl);
}

/**
 * Uploads one photo. Up to 4 MB goes through the API; larger photos (up to
 * 10 MB) go straight to S3 with a signed URL and are then confirmed.
 */
export async function uploadJobPhoto(serviceId, file, type, fetchImpl = fetch) {
  if (file.size > MAX_PHOTO_BYTES) {
    throw new JobApiError(`${file.name || 'Photo'} is larger than 10 MB`, { status: 413, code: 'PHOTO_TOO_LARGE' });
  }
  const contentType = photoContentType(file);
  if (file.size <= MAX_PROXY_UPLOAD_BYTES) {
    const form = new FormData();
    form.append('file', file, file.name || 'photo');
    form.append('type', type);
    return request(`/api/employee/services/${serviceId}/photos`, { method: 'POST', body: form }, fetchImpl);
  }

  const grant = await request(
    `/api/employee/services/${serviceId}/photos/upload-url`,
    { method: 'POST', ...json({ type, contentType, size: file.size }) },
    fetchImpl
  );
  // Cross-origin request to S3: no cookies.
  const put = await fetchImpl(grant.uploadUrl, { method: 'PUT', headers: grant.headers, body: file, credentials: 'omit' });
  if (!put.ok) {
    throw new JobApiError(`Photo upload to storage failed (${put.status})`, { status: put.status, code: 'STORAGE_UPLOAD_FAILED' });
  }
  return request(
    `/api/employee/services/${serviceId}/photos`,
    { method: 'POST', ...json({ key: grant.key, type: grant.type }) },
    fetchImpl
  );
}

/** Human-readable reason a completion was refused. */
export function completionErrorMessage(error) {
  const details = error?.details || {};
  if (details.code === 'PHOTOS_REQUIRED' && Array.isArray(details.missingPhotos)) {
    return `Still needed: ${details.missingPhotos.map((m) => `${m.required - m.uploaded} ${m.type.toLowerCase()}`).join(' and ')} photo(s)`;
  }
  if (details.code === 'CHECKLIST_INCOMPLETE' && Array.isArray(details.missingItems)) {
    return `Checklist not finished: ${details.missingItems.join(', ')}`;
  }
  return error?.message || 'Failed to complete service';
}
