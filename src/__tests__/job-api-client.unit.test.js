/**
 * @jest-environment node
 */
const {
  uploadJobPhoto,
  photoContentType,
  completionErrorMessage,
  JobApiError,
  MAX_PROXY_UPLOAD_BYTES,
} = require('@/lib/job-api-client');

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

describe('job-api-client', () => {
  test('infers HEIC content type when the phone leaves type blank', () => {
    expect(photoContentType({ type: 'image/png', name: 'a.png' })).toBe('image/png');
    expect(photoContentType({ type: '', name: 'yard.HEIC' })).toBe('image/heic');
  });

  test('uploads small photos through the API as multipart', async () => {
    const calls = [];
    const fetchImpl = async (url, options = {}) => {
      calls.push({ url, options });
      expect(options.body).toBeInstanceOf(FormData);
      expect(options.body.get('type')).toBe('BEFORE');
      return jsonResponse({ success: true, photo: { id: 'p1', type: 'BEFORE' } });
    };
    const file = new File([Buffer.alloc(100, 1)], 'yard.jpg', { type: 'image/jpeg' });
    const result = await uploadJobPhoto('svc-1', file, 'BEFORE', fetchImpl);
    expect(result.photo.id).toBe('p1');
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('/api/employee/services/svc-1/photos');
  });

  test('uploads large photos with a signed URL, then confirms the key', async () => {
    const calls = [];
    const fetchImpl = async (url, options = {}) => {
      calls.push({ url: String(url), method: options.method, headers: options.headers, body: options.body });
      if (String(url).includes('upload-url')) {
        return jsonResponse({
          uploadUrl: 'https://bucket.s3.us-west-2.amazonaws.com/key?X-Amz-Signature=abc',
          key: 'services/svc-1/AFTER/photo.jpg',
          type: 'AFTER',
          headers: { 'Content-Type': 'image/jpeg', 'x-amz-server-side-encryption': 'AES256' },
        });
      }
      if (String(url).startsWith('https://bucket')) {
        expect(options.method).toBe('PUT');
        expect(options.headers['x-amz-server-side-encryption']).toBe('AES256');
        expect(options.credentials).toBe('omit');
        return { ok: true, status: 200, json: async () => ({}) };
      }
      expect(JSON.parse(options.body)).toEqual({ key: 'services/svc-1/AFTER/photo.jpg', type: 'AFTER' });
      return jsonResponse({ success: true, photo: { id: 'p2', type: 'AFTER' } });
    };
    const file = new File([Buffer.alloc(MAX_PROXY_UPLOAD_BYTES + 1, 2)], 'big.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: MAX_PROXY_UPLOAD_BYTES + 1 });
    const result = await uploadJobPhoto('svc-1', file, 'AFTER', fetchImpl);
    expect(result.photo.id).toBe('p2');
    expect(calls.map((c) => c.url)).toEqual([
      '/api/employee/services/svc-1/photos/upload-url',
      'https://bucket.s3.us-west-2.amazonaws.com/key?X-Amz-Signature=abc',
      '/api/employee/services/svc-1/photos',
    ]);
  });

  test('rejects photos over 10 MB before calling the API', async () => {
    const fetchImpl = jest.fn();
    const file = { name: 'huge.jpg', type: 'image/jpeg', size: 11 * 1024 * 1024 };
    await expect(uploadJobPhoto('svc-1', file, 'BEFORE', fetchImpl)).rejects.toMatchObject({
      code: 'PHOTO_TOO_LARGE',
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test('formats completion errors with what is still missing', () => {
    expect(completionErrorMessage(new JobApiError('x', {
      details: { code: 'PHOTOS_REQUIRED', missingPhotos: [{ type: 'BEFORE', required: 4, uploaded: 2 }] },
    }))).toContain('2 before');
    expect(completionErrorMessage(new JobApiError('x', {
      details: { code: 'CHECKLIST_INCOMPLETE', missingItems: ['gateClosed'] },
    }))).toContain('gateClosed');
  });
});
